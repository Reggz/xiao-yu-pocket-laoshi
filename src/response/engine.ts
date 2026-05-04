import { Curriculum, GrammarItem } from "../curriculum/types";
import { pickTemplate } from "./templates";
import { LlmAdapter } from "../llm/adapter";
import { generateWithGuardrails } from "./llm";
import { buildConversationBuffer, InteractionSnippet } from "./buffer";
import { Budget } from "../llm/throttle";
import { shouldUseLlm, consumeLlm, LlmPolicy } from "../llm/manager";
import { formatPinyinLine, toToneMarks } from "./pinyin";

export type ResponseCache = {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string) => Promise<void>;
};

export type ResponseContext = {
  curriculum: Curriculum;
  allowedLevels: string[];
  topics: string[];
  topicBiasRatio: number;
  grammar: GrammarItem[];
  conversation: InteractionSnippet[];
  budget: Budget;
  llmPolicy: LlmPolicy;
  cache?: ResponseCache;
};

export type ResponseResult = {
  text: string;
  usedLlm: boolean;
  budget: Budget;
  fromCache?: boolean;
};

const BOT_NAME = "Xiao Yu";

function formatLlmOutput(text: string): string {
  const lines = text
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length >= 2) {
    lines[1] = formatPinyinLine(lines[1]);
    return lines.slice(0, 3).join("\n");
  }
  return formatPinyinLine(text.trim());
}

function buildCacheKey(userText: string, context: ResponseContext): string {
  const level = context.allowedLevels.join(",") || "A0";
  const topics = context.topics.join(",") || "any";
  return `free_chat|${level}|${topics}|${userText.trim().toLowerCase()}`;
}

export async function generateResponse(
  adapter: LlmAdapter | null,
  userText: string,
  context: ResponseContext
): Promise<ResponseResult> {
  const template = pickTemplate(
    context.curriculum,
    context.allowedLevels,
    context.topics,
    context.topicBiasRatio
  );

  const fallback = template
    ? `${template.hanzi}\n${toToneMarks(template.pinyin)}\n${template.english}`
    : "好的。";

  if (!adapter) {
    return { text: fallback, usedLlm: false, budget: context.budget };
  }

  if (!shouldUseLlm(context.llmPolicy, context.budget)) {
    return { text: fallback, usedLlm: false, budget: context.budget };
  }

  const cacheKey = buildCacheKey(userText, context);
  if (context.cache) {
    try {
      const cached = await context.cache.get(cacheKey);
      if (cached) {
        return { text: cached, usedLlm: false, fromCache: true, budget: context.budget };
      }
    } catch {
      // soft-fail cache
    }
  }

  const buffer = buildConversationBuffer(context.conversation, 5, 120);
  const history = buffer
    .map((t) => `User: ${t.input}\nBot: ${t.output}`)
    .join("\n");

  const prompt =
    `You are ${BOT_NAME} (小语), a Mandarin tutor.\n` +
    "Always respond in exactly 3 lines: (1) Chinese, (2) pinyin with tone marks, (3) English.\n" +
    "Keep sentences short, beginner-friendly, and level-appropriate.\n" +
    "If the user asks for an explanation, provide a short bilingual explanation.\n" +
    `${history}\nUser: ${userText}\nBot:`;

  try {
    const text = await generateWithGuardrails(adapter, prompt, {
      allowedGrammar: context.grammar,
      allowOneNonCritical: true
    });
    const formatted = formatLlmOutput(text);
    if (context.cache) {
      try {
        await context.cache.set(cacheKey, formatted);
      } catch {
        // soft-fail cache
      }
    }
    const newBudget = consumeLlm(context.llmPolicy, context.budget);
    return { text: formatted, usedLlm: true, budget: newBudget };
  } catch {
    return { text: fallback, usedLlm: false, budget: context.budget };
  }
}

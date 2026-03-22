import { Curriculum, GrammarItem } from "../curriculum/types";
import { pickTemplate } from "./templates";
import { LlmAdapter } from "../llm/adapter";
import { generateWithGuardrails } from "./llm";
import { buildConversationBuffer, InteractionSnippet } from "./buffer";
import { Budget } from "../llm/throttle";
import { shouldUseLlm, consumeLlm, LlmPolicy } from "../llm/manager";

export type ResponseContext = {
  curriculum: Curriculum;
  allowedLevels: string[];
  topics: string[];
  topicBiasRatio: number;
  grammar: GrammarItem[];
  conversation: InteractionSnippet[];
  budget: Budget;
  llmPolicy: LlmPolicy;
};

export type ResponseResult = {
  text: string;
  usedLlm: boolean;
  budget: Budget;
};

const BOT_NAME = "Xiao Yu";

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
    ? `${template.hanzi}\n${template.pinyin}\n${template.english}`
    : "好的。";

  if (!adapter) {
    return { text: fallback, usedLlm: false, budget: context.budget };
  }

  if (!shouldUseLlm(context.llmPolicy, context.budget)) {
    return { text: fallback, usedLlm: false, budget: context.budget };
  }

  const buffer = buildConversationBuffer(context.conversation, 5, 120);
  const history = buffer
    .map((t) => `User: ${t.input}\nBot: ${t.output}`)
    .join("\n");

  const prompt =
    `You are ${BOT_NAME} (小语), a Mandarin tutor.\n` +
    "Always respond in exactly 3 lines: (1) Chinese, (2) pinyin with tone numbers, (3) English.\n" +
    "Keep sentences short, beginner-friendly, and level-appropriate.\n" +
    "If the user asks for an explanation, provide a short bilingual explanation.\n" +
    `${history}\nUser: ${userText}\nBot:`;

  try {
    const text = await generateWithGuardrails(adapter, prompt, {
      allowedGrammar: context.grammar,
      allowOneNonCritical: true
    });
    const newBudget = consumeLlm(context.llmPolicy, context.budget);
    return { text, usedLlm: true, budget: newBudget };
  } catch (err) {
    return { text: fallback, usedLlm: false, budget: context.budget };
  }
}

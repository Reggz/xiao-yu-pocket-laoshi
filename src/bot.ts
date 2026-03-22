import { Bot, InlineKeyboard } from "grammy";
import { loadConfig } from "./config";
import { loadCurriculumFromFile } from "./curriculum/loader";
import { startDisambiguation, isDisambiguationExpired, resolveDisambiguation } from "./input/disambiguation";
import { runInputPipeline } from "./input/pipeline";
import { buildAutoHint, buildCorrectionHint } from "./response/hints";
import {
  appendInteraction,
  clearDisambiguation,
  getSession,
  getTopicBiasRatio,
  getTopics,
  setDisambiguation,
  setTopicBiasRatio,
  setTopics
} from "./bot/state";
import { checkSafety, safetyResponse } from "./safety/filter";
import { menuOptions } from "./bot/menu";
import { validateTopicSelection } from "./onboarding/topics";
import { recordInteraction } from "./storage/db";
import { createLlmAdapter } from "./llm/factory";
import { generateResponse } from "./response/engine";
import { selectAllowedGrammar } from "./response/grammar";
import { initBudget } from "./llm/manager";

const config = loadConfig();
const curriculum = loadCurriculumFromFile("docs/curriculum_seed.md");
const llmAdapter = (() => {
  try {
    return createLlmAdapter(config);
  } catch {
    return null;
  }
})();

export const bot = new Bot(config.telegramBotToken);

let isInitialized = false;
export async function ensureBotInit(): Promise<void> {
  if (isInitialized) return;
  await bot.init();
  isInitialized = true;
}

function buildDisambKeyboard(candidates: string[]): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  candidates.slice(0, 3).forEach((c) => {
    keyboard.text(c, `disamb:${c}`);
  });
  return keyboard;
}

function buildLlmPolicy() {
  return { maxCallsPerSession: 3, disableCaps: config.llmDisableCaps ?? false };
}

bot.command("ping", (ctx) => ctx.reply("pong"));

bot.command("menu", async (ctx) => {
  const lines = ["Menu:", ...menuOptions.map((m) => `- ${m.label}`)];
  await ctx.reply(lines.join("\n"));
});

bot.command("topics", async (ctx) => {
  const msg = ctx.message;
  const from = ctx.from;
  if (!msg?.text || !from) {
    await ctx.reply("Send topics as comma-separated list. Example: /topics Food/Drink, Work");
    return;
  }
  const input = msg.text.replace("/topics", "").trim();
  if (!input) {
    await ctx.reply("Send topics as comma-separated list. Example: /topics Food/Drink, Work");
    return;
  }
  const parsed = input.split(",").map((t) => t.trim()).filter(Boolean);
  const validated = validateTopicSelection(parsed);
  setTopics(from.id.toString(), validated);
  await ctx.reply(`Topics set: ${validated.join(", ") || "(none)"}`);
});

bot.command("bias", async (ctx) => {
  const msg = ctx.message;
  const from = ctx.from;
  if (!msg?.text || !from) {
    await ctx.reply("Set bias as a number between 0 and 1. Example: /bias 0.7");
    return;
  }
  const input = msg.text.replace("/bias", "").trim();
  const value = parseFloat(input);
  if (Number.isNaN(value) || value < 0 || value > 1) {
    await ctx.reply("Set bias as a number between 0 and 1. Example: /bias 0.7");
    return;
  }
  setTopicBiasRatio(from.id.toString(), value);
  await ctx.reply(`Topic bias ratio set to ${value}`);
});

bot.on("callback_query:data", async (ctx) => {
  const data = ctx.callbackQuery.data;
  if (!data.startsWith("disamb:")) return;
  const userId = ctx.from?.id?.toString();
  if (!userId) return;

  const session = getSession(userId);
  const state = session.disambiguation;
  if (!state) {
    await ctx.answerCallbackQuery({ text: "No pending choice." });
    return;
  }
  if (isDisambiguationExpired(state, Date.now())) {
    clearDisambiguation(userId);
    await ctx.answerCallbackQuery({ text: "Choice expired." });
    return;
  }

  const selection = data.slice("disamb:".length);
  const resolved = resolveDisambiguation(state, selection);
  if (!resolved) {
    await ctx.answerCallbackQuery({ text: "Invalid choice." });
    return;
  }

  clearDisambiguation(userId);
  const result = await generateResponse(llmAdapter, resolved, {
    curriculum,
    allowedLevels: ["A0"],
    topics: getTopics(userId),
    topicBiasRatio: getTopicBiasRatio(userId),
    grammar: selectAllowedGrammar([], ["critical", "core", "advanced"]),
    conversation: session.buffer,
    budget: initBudget(buildLlmPolicy()),
    llmPolicy: buildLlmPolicy()
  });

  await ctx.answerCallbackQuery();
  await ctx.reply(`已选择：${resolved}\n${result.text}`);
  appendInteraction(userId, resolved, result.text);
});

bot.on("message:text", async (ctx) => {
  const text = ctx.message.text;
  const userId = ctx.from?.id?.toString();
  if (!userId) return;

  const safety = checkSafety(text);
  if (safety.blocked) {
    await ctx.reply(safetyResponse());
    return;
  }

  const session = getSession(userId);
  if (session.disambiguation) {
    const state = session.disambiguation;
    if (isDisambiguationExpired(state, Date.now())) {
      clearDisambiguation(userId);
    } else {
      const trimmed = text.trim();
      let selection: string | null = null;
      if (/^[1-9]$/.test(trimmed)) {
        const idx = parseInt(trimmed, 10) - 1;
        selection = state.candidates[idx] ?? null;
      }
      if (!selection && state.candidates.includes(trimmed)) {
        selection = trimmed;
      }
      if (selection) {
        clearDisambiguation(userId);
        const result = await generateResponse(llmAdapter, selection, {
          curriculum,
          allowedLevels: ["A0"],
          topics: getTopics(userId),
          topicBiasRatio: getTopicBiasRatio(userId),
          grammar: selectAllowedGrammar([], ["critical", "core", "advanced"]),
          conversation: session.buffer,
          budget: initBudget(buildLlmPolicy()),
          llmPolicy: buildLlmPolicy()
        });
        await ctx.reply(`已选择：${selection}\n${result.text}`);
        appendInteraction(userId, selection, result.text);
        return;
      }
    }
  }

  const { normalized, candidates, corrections, englishHints } = runInputPipeline(text);

  if (candidates.length > 1) {
    const disamb = startDisambiguation(text, candidates, Date.now());
    if (disamb.state) {
      setDisambiguation(userId, disamb.state);
      const keyboard = buildDisambKeyboard(candidates);
      await ctx.reply(disamb.prompt ?? "Did you mean one of these?", { reply_markup: keyboard });
      return;
    }
  }

  const result = await generateResponse(llmAdapter, text, {
    curriculum,
    allowedLevels: ["A0"],
    topics: getTopics(userId),
    topicBiasRatio: getTopicBiasRatio(userId),
    grammar: selectAllowedGrammar([], ["critical", "core", "advanced"]),
    conversation: session.buffer,
    budget: initBudget(buildLlmPolicy()),
    llmPolicy: buildLlmPolicy()
  });

  const hintMessages: string[] = [];
  if (corrections.length > 0 && normalized.canonicalPinyin) {
    const correction = corrections[0];
    if (correction && correction !== normalized.canonicalPinyin) {
      hintMessages.push(
        buildCorrectionHint(
          normalized.canonicalPinyin,
          correction,
          "注意常见拼音混淆。"
        ).message
      );
    }
  }

  for (const hint of englishHints) {
    hintMessages.push(buildAutoHint(hint.english, hint.hanzi, hint.pinyin).message);
  }

  const finalOutput = hintMessages.length
    ? `${result.text}\n\n${hintMessages.join("\n")}`
    : result.text;

  await ctx.reply(finalOutput);
  appendInteraction(userId, text, finalOutput);

  await recordInteraction(config.databaseUrl, {
    userId,
    channel: "telegram",
    type: "chat",
    mode: "free_text",
    state: session.disambiguation ? "awaiting_disambiguation" : "normal",
    inputTextRaw: text,
    inputTextNormalized: normalized.hanzi,
    inputPinyinNormalized: normalized.canonicalPinyin,
    missingTone: normalized.missingTone,
    outputText: finalOutput
  });
});

export function startBot(): void {
  bot.start();
}

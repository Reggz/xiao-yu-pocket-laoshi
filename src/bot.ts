import { Bot, InlineKeyboard } from "grammy";
import { loadConfig } from "./config";
import { loadCurriculumFromFile } from "./curriculum/loader";
import { startDisambiguation, isDisambiguationExpired, resolveDisambiguation } from "./input/disambiguation";
import { runInputPipeline } from "./input/pipeline";
import { buildAutoHint, buildCorrectionHint } from "./response/hints";
import {
  appendInteraction,
  clearDisambiguation,
  getActiveMode,
  getDrillSession,
  getLevel,
  getSession,
  getTopicBiasRatio,
  getTopics,
  getPendingDrill,
  getPlacement,
  isOnboardingComplete,
  isPaused,
  resetSession,
  setActiveMode,
  setDisambiguation,
  setDrillSession,
  setLevel,
  setOnboardingComplete,
  setPaused,
  setPendingDrill,
  setTopicBiasRatio,
  setTopics,
  shouldSendMenuPrompt,
  shouldSendPausedPrompt,
  startPlacement,
  stopPlacement,
  updatePlacement
} from "./bot/state";
import { checkSafety, safetyResponse } from "./safety/filter";
import { menuOptions } from "./bot/menu";
import { validateTopicSelection } from "./onboarding/topics";
import { logInteractionSafe } from "./storage/logging";
import { createLlmAdapter } from "./llm/factory";
import { generateResponse } from "./response/engine";
import { toToneMarks } from "./response/pinyin";
import { selectAllowedGrammar } from "./response/grammar";
import { initBudget } from "./llm/manager";
import { buildGrammarDrill, buildMicroDrill, buildToneDrill } from "./drills/quick";
import { placementQuestions, evaluatePlacementAnswer, scorePlacement } from "./onboarding/placement";

const config = loadConfig();
const curriculum = loadCurriculumFromFile("docs/curriculum_seed.md");
const llmAdapter = (() => {
  try {
    return createLlmAdapter(config);
  } catch {
    return null;
  }
})();

const HELP_PATTERNS = [
  /i\s*don'?t\s*understand/i,
  /^what\??$/i,
  /^help$/i,
  /how\s+do\s*i\s+reply/i,
  /how\s+do\s+i\s+respond/i
];

const EXPLAIN_PATTERNS = [/can\s+you\s+explain/i, /please\s+explain/i, /explain\s+that/i];

const MICRO_DRILL_ALIASES = new Set(["micro-drills", "micro drills", "microdrills"]);
const TONE_DRILL_ALIASES = new Set(["tone practice", "tone", "tone-drills", "tone drills"]);
const PLACEMENT_ALIASES = new Set(["placement", "placement test", "start placement"]);
const SKIP_ALIASES = new Set(["skip", "skip placement"]);

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

function buildDrillKeyboard(options: string[]): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  options.forEach((o) => keyboard.text(o, `drill:${o}`));
  return keyboard;
}

function buildOnboardingKeyboard(): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  keyboard.text("Start Placement", "onboard:placement");
  keyboard.text("Skip", "onboard:skip");
  return keyboard;

}

function buildEntryMenuKeyboard(): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  keyboard.text("Placement (Recommended)", "menu:placement");
  keyboard.text("Start Drill", "menu:drill");
  keyboard.text("Advanced Free Chat", "menu:free_chat");
  return keyboard;
}

function buildReturnMenuKeyboard(): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  keyboard.text("Start Drill", "menu:drill");
  keyboard.text("Advanced Free Chat", "menu:free_chat");
  keyboard.text("Settings", "menu:settings");
  return keyboard;
}

async function sendEntryMenu(ctx: any, userId: string): Promise<void> {
  const message =
    "Hi, I’m Xiao Yu — your pocket laoshi.\n" +
    "Choose how you want to start:";
  await ctx.reply(message, { reply_markup: buildEntryMenuKeyboard() });
  setActiveMode(userId, "menu");
}

async function sendReturnMenu(ctx: any, userId: string): Promise<void> {
  const message = "Ready for today’s practice?";
  await ctx.reply(message, { reply_markup: buildReturnMenuKeyboard() });
  setActiveMode(userId, "menu");
}

function buildSettingsMessage(): string {
  return (
    "Settings:\n" +
    "- /topics Food/Drink, Work\n" +
    "- /bias 0.7\n" +
    "- /pause or /resume\n" +
    "- /reset"
  );
}

function initDrillSession(total = 5) {
  return { total, remaining: total, correct: 0, items: [] as string[] };
}

async function sendNextDrill(ctx: any, userId: string): Promise<void> {
  const session = getSession(userId);
  const drillSession = session.drillSession;
  if (!drillSession || drillSession.remaining <= 0) return;

  const roll = Math.random();
  let question = null;
  if (roll < 0.7) {
    question = buildMicroDrill(curriculum);
  } else if (roll < 0.9) {
    question = buildGrammarDrill(curriculum);
  } else {
    question = buildToneDrill(curriculum);
  }

  if (!question) {
    question = buildMicroDrill(curriculum) || buildGrammarDrill(curriculum) || buildToneDrill(curriculum);
  }
  if (!question) {
    await ctx.reply("No drills available yet.");
    setDrillSession(userId, undefined);
    return;
  }

  setPendingDrill(userId, question);
  await ctx.reply(question.prompt, { reply_markup: buildDrillKeyboard(question.options) });
}

async function startDrillSession(ctx: any, userId: string): Promise<void> {
  setActiveMode(userId, "drill");
  setDrillSession(userId, initDrillSession(5));
  await sendNextDrill(ctx, userId);
}

function buildDrillSummary(userId: string): string {
  const session = getDrillSession(userId);
  if (!session) return "Session complete.";
  const items = session.items.slice(0, 4);
  const itemsLine = items.length ? `Reviewed: ${items.join(" · ")}` : "Reviewed: (none)";
  return (
    `Session complete. Score: ${session.correct}/${session.total}.\n` +
    `${itemsLine}`
  );
}

async function finishDrillSession(ctx: any, userId: string): Promise<void> {
  const summary = buildDrillSummary(userId);
  await ctx.reply(summary);
  setDrillSession(userId, undefined);
  await sendReturnMenu(ctx, userId);
}
}

function buildLlmPolicy() {
  return { maxCallsPerSession: 3, disableCaps: config.llmDisableCaps ?? false };
}

function shouldDisambiguate(candidates: string[], pinyin: string): boolean {
  if (candidates.length <= 1) return false;
  const syllables = pinyin.trim().split(/\s+/).filter(Boolean);
  return syllables.length === 1;
}

function isHelpIntent(text: string): boolean {
  return HELP_PATTERNS.some((p) => p.test(text.trim()));
}

function isExplainIntent(text: string): boolean {
  return EXPLAIN_PATTERNS.some((p) => p.test(text.trim()));
}

function buildHelpResponse(): string {
  const pinyin = toToneMarks("mei2 guan1 xi, wo3 ke3 yi3 bang1 zhu4 ni3. ni3 ke3 yi3 shuo1: ni3 hao3 / wo3 jiao4… / wo3 hen3 hao3");
  return (
    "没关系，我可以帮助你。你可以说：你好 / 我叫… / 我很好。\n" +
    pinyin +
    "\n" +
    "No worries, I can help. You can say: hello / my name is… / I’m good."
  );
}

function buildExplainResponse(): string {
  const pinyin = toToneMarks("ke3 yi3 de. qing3 gao4 su4 wo3 ni3 xiang3 jie3 shi4 de ci2 huo4 ju4 zi.");
  return (
    "可以的。请告诉我你想解释的词或句子。\n" +
    pinyin +
    "\n" +
    "Sure. Tell me the word or sentence you want explained."
  );
}

function currentPlacementPrompt(index: number): string | null {
  const q = placementQuestions[index];
  if (!q) return null;
  return q.prompt;
}

async function sendMicroDrill(ctx: any, userId: string): Promise<void> {
  const q = buildMicroDrill(curriculum);
  if (!q) {
    await ctx.reply("No drills available yet.");
    return;
  }
  setPendingDrill(userId, q);
  await ctx.reply(q.prompt, { reply_markup: buildDrillKeyboard(q.options) });
}

async function sendToneDrill(ctx: any, userId: string): Promise<void> {
  const q = buildToneDrill(curriculum);
  if (!q) {
    await ctx.reply("No tone drills available yet.");
    return;
  }
  setPendingDrill(userId, q);
  await ctx.reply(q.prompt, { reply_markup: buildDrillKeyboard(q.options) });
}

bot.command("start", async (ctx) => {
  const from = ctx.from;
  if (!from) return;
  setOnboardingComplete(from.id.toString(), false);
  stopPlacement(from.id.toString());
  setActiveMode(from.id.toString(), undefined);
  await sendEntryMenu(ctx, from.id.toString());
});

bot.command("done", async (ctx) => {
  const from = ctx.from;
  if (!from) return;
  setOnboardingComplete(from.id.toString(), true);
  stopPlacement(from.id.toString());
  await ctx.reply("Onboarding complete. Send a message to begin.");
bot.command("done", async (ctx) => {
  const from = ctx.from;
  if (!from) return;
  setOnboardingComplete(from.id.toString(), true);
  stopPlacement(from.id.toString());
  await sendReturnMenu(ctx, from.id.toString());
});

bot.command("skip", async (ctx) => {
  const from = ctx.from;
  if (!from) return;
  setOnboardingComplete(from.id.toString(), true);
  stopPlacement(from.id.toString());
  await sendReturnMenu(ctx, from.id.toString());
});
  if (prompt) {
    await ctx.reply(`Placement Q1: ${prompt}`);
  }
});

bot.command("pause", async (ctx) => {
  const from = ctx.from;
  if (!from) return;
  setPaused(from.id.toString(), true);
  await ctx.reply("Paused. Use /resume to continue.");
});

bot.command("resume", async (ctx) => {
  const from = ctx.from;
  if (!from) return;
  setPaused(from.id.toString(), false);
  await ctx.reply("Resumed. Send a message to begin.");
});

bot.command("reset", async (ctx) => {
  const from = ctx.from;
  if (!from) return;
  resetSession(from.id.toString());
  await ctx.reply("Session reset. Use /start to onboard again.");
});

bot.command("drill", async (ctx) => {
  const from = ctx.from;
  if (!from) return;
  await sendMicroDrill(ctx, from.id.toString());
});

bot.command("drill", async (ctx) => {
  const from = ctx.from;
  if (!from) return;
  setOnboardingComplete(from.id.toString(), true);
  await startDrillSession(ctx, from.id.toString());
});

bot.command("tone", async (ctx) => {
  const from = ctx.from;
  if (!from) return;
  setOnboardingComplete(from.id.toString(), true);
  await sendToneDrill(ctx, from.id.toString());
});

bot.command("ping", (ctx) => ctx.reply("pong"));

bot.command("menu", async (ctx) => {
  const from = ctx.from;
  if (!from) return;
  await sendReturnMenu(ctx, from.id.toString());
});
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

  if (data.startsWith("onboard:")) {
    const userId = ctx.from?.id?.toString();
    if (!userId) return;
    if (data === "onboard:skip") {
      setOnboardingComplete(userId, true);
      stopPlacement(userId);
      await ctx.answerCallbackQuery();
      await ctx.reply("Skipped onboarding. Send a message to begin.");
      return;
    }
    if (data === "onboard:placement") {
      startPlacement(userId);
      await ctx.answerCallbackQuery();
      const prompt = currentPlacementPrompt(0);
      if (prompt) {
        await ctx.reply(`Placement Q1: ${prompt}`);
      }
      return;
    }
  }

  if (data.startsWith("menu:")) {
    const userId = ctx.from?.id?.toString();
    if (!userId) return;
    await ctx.answerCallbackQuery();
    if (data === "menu:placement") {
      startPlacement(userId);
      setActiveMode(userId, undefined);
      const prompt = currentPlacementPrompt(0);
      if (prompt) {
        await ctx.reply(`Placement Q1: ${prompt}`);
      }
      return;
    }
    if (data === "menu:drill") {
      setOnboardingComplete(userId, true);
      await startDrillSession(ctx, userId);
      return;
    }
    if (data === "menu:free_chat") {
      setOnboardingComplete(userId, true);
      setActiveMode(userId, "free_chat");
      await ctx.reply("Advanced free chat enabled. Send a message.");
      return;
    }
    if (data === "menu:settings") {
      await ctx.reply(buildSettingsMessage());
      setActiveMode(userId, "menu");
      return;
    }
  }

  if (data.startsWith("drill:")) {
    const userId = ctx.from?.id?.toString();
    if (!userId) return;
    const drill = getPendingDrill(userId);
    if (!drill) {
      await ctx.answerCallbackQuery({ text: "No active drill." });
      return;
    }
    const answer = data.slice("drill:".length);
    const correct = answer === drill.answer;
    setPendingDrill(userId, undefined);
    await ctx.answerCallbackQuery();
    await ctx.reply(correct ? "Correct!" : `Not quite. Answer: ${drill.answer}`);

    const drillSession = getDrillSession(userId);
    if (drillSession) {
      drillSession.remaining -= 1;
      if (correct) drillSession.correct += 1;
      if (drill.target) drillSession.items.push(drill.target);
      if (drillSession.remaining <= 0) {
        await finishDrillSession(ctx, userId);
        return;
      }
      await sendNextDrill(ctx, userId);
    }
    return;
  }

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
    allowedLevels: [getLevel(userId)],
    topics: getTopics(userId),
    topicBiasRatio: getTopicBiasRatio(userId),
    grammar: selectAllowedGrammar([], ["critical", "core", "advanced"]),
    conversation: session.buffer,
    budget: initBudget(buildLlmPolicy()),
    llmPolicy: buildLlmPolicy()
  });

  await ctx.answerCallbackQuery();
  const replyText = `已选择：${resolved}\n${result.text}`;
  await ctx.reply(replyText);
  appendInteraction(userId, resolved, result.text);
  await logInteractionSafe({
    databaseUrl: config.databaseUrl,
    telegramId: userId,
    telegramHandle: ctx.from?.username,
    preferredName: ctx.from?.first_name,
    input: state.pendingInput,
    output: replyText,
    mode: "disambiguation"
  });
});

bot.on("message:text", async (ctx) => {
  const text = ctx.message.text;
  const userId = ctx.from?.id?.toString();
  if (!userId) return;

  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  if (MICRO_DRILL_ALIASES.has(lower)) {
    setOnboardingComplete(userId, true);
    await startDrillSession(ctx, userId);
    return;
  }

  if (TONE_DRILL_ALIASES.has(lower)) {
    setOnboardingComplete(userId, true);
    await sendToneDrill(ctx, userId);
    return;
  }

  const placement = getPlacement(userId);
  if (placement?.active) {
    if (SKIP_ALIASES.has(lower)) {
      setOnboardingComplete(userId, true);
      stopPlacement(userId);
      await sendReturnMenu(ctx, userId);
      return;
    }
    const q = placementQuestions[placement.index];
    if (!q) {
      const level = scorePlacement(placement.correct);
      setLevel(userId, level);
      setOnboardingComplete(userId, true);
      stopPlacement(userId);
      await sendReturnMenu(ctx, userId);
      return;
    }
    const correct = evaluatePlacementAnswer(text, q.expectedKeywords);
    updatePlacement(userId, correct);
    const nextPrompt = currentPlacementPrompt(placement.index + 1);
    if (nextPrompt) {
      await ctx.reply(`Placement Q${placement.index + 2}: ${nextPrompt}`);
    } else {
      const level = scorePlacement(placement.correct + (correct ? 1 : 0));
      setLevel(userId, level);
      setOnboardingComplete(userId, true);
      stopPlacement(userId);
      await sendReturnMenu(ctx, userId);
    }
    return;
  }

  if (!isOnboardingComplete(userId) && PLACEMENT_ALIASES.has(lower)) {
    startPlacement(userId);
    const prompt = currentPlacementPrompt(0);
    if (prompt) {
      await ctx.reply(`Placement Q1: ${prompt}`);
    }
    return;
  }

  if (!isOnboardingComplete(userId) && SKIP_ALIASES.has(lower)) {
    setOnboardingComplete(userId, true);
    stopPlacement(userId);
    await sendReturnMenu(ctx, userId);
    return;
  }

  const now = Date.now();
  if (isPaused(userId)) {
    if (shouldSendPausedPrompt(userId, now)) {
      await ctx.reply("Paused. Use /resume to continue.");
    }
    return;
  }

  if (!isOnboardingComplete(userId)) {
    if (shouldSendMenuPrompt(userId, now)) {
      await sendEntryMenu(ctx, userId);
    }
    return;
  }
  const activeMode = getActiveMode(userId);
  const drillSession = getDrillSession(userId);
  if (drillSession) {
    if (getPendingDrill(userId)) {
      await ctx.reply("Please select an option above.");
      return;
    }
    await sendNextDrill(ctx, userId);
    return;
  }

  if (activeMode !== "free_chat") {
    if (shouldSendMenuPrompt(userId, now)) {
      await sendReturnMenu(ctx, userId);
    }
    return;
  }

  if (isHelpIntent(text)) {
    const help = buildHelpResponse();
    await ctx.reply(help);
    await logInteractionSafe({
      databaseUrl: config.databaseUrl,
      telegramId: userId,
      telegramHandle: ctx.from?.username,
      preferredName: ctx.from?.first_name,
      input: text,
      output: help,
      mode: "help"
    });
    return;
  }

  if (isExplainIntent(text)) {
    const explain = buildExplainResponse();
    await ctx.reply(explain);
    await logInteractionSafe({
      databaseUrl: config.databaseUrl,
      telegramId: userId,
      telegramHandle: ctx.from?.username,
      preferredName: ctx.from?.first_name,
      input: text,
      output: explain,
      mode: "explain"
    });
    return;
  }
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
      const trimmedSelection = text.trim();
      let selection: string | null = null;
      if (/^[1-9]$/.test(trimmedSelection)) {
        const idx = parseInt(trimmedSelection, 10) - 1;
        selection = state.candidates[idx] ?? null;
      }
      if (!selection && state.candidates.includes(trimmedSelection)) {
        selection = trimmedSelection;
      }
      if (selection) {
        clearDisambiguation(userId);
        const result = await generateResponse(llmAdapter, selection, {
          curriculum,
          allowedLevels: [getLevel(userId)],
          topics: getTopics(userId),
          topicBiasRatio: getTopicBiasRatio(userId),
          grammar: selectAllowedGrammar([], ["critical", "core", "advanced"]),
          conversation: session.buffer,
          budget: initBudget(buildLlmPolicy()),
          llmPolicy: buildLlmPolicy()
        });
        const replyText = `已选择：${selection}\n${result.text}`;
        await ctx.reply(replyText);
        appendInteraction(userId, selection, result.text);
        await logInteractionSafe({
          databaseUrl: config.databaseUrl,
          telegramId: userId,
          telegramHandle: ctx.from?.username,
          preferredName: ctx.from?.first_name,
          input: state.pendingInput,
          output: replyText,
          mode: "disambiguation"
        });
        return;
      }
    }
  }


  const { normalized, candidates, corrections, englishHints } = runInputPipeline(text);

  if (shouldDisambiguate(candidates, normalized.canonicalPinyin)) {
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
    allowedLevels: [getLevel(userId)],
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

  await logInteractionSafe({
    databaseUrl: config.databaseUrl,
    telegramId: userId,
    telegramHandle: ctx.from?.username,
    preferredName: ctx.from?.first_name,
    input: text,
    output: finalOutput,
    mode: "free_text",
    state: session.disambiguation ? "awaiting_disambiguation" : "normal"
  });
});

export function startBot(): void {
  bot.start();
}

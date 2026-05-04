import { Bot, InlineKeyboard } from "grammy";
import { loadConfig } from "./config";
import { loadCurriculumFromFile } from "./curriculum/loader";
import { listAllTopics } from "./curriculum/helpers";
import { CurriculumItem, CurriculumUnit, GrammarItem } from "./curriculum/types";
import { startDisambiguation, isDisambiguationExpired, resolveDisambiguation } from "./input/disambiguation";
import { runInputPipeline } from "./input/pipeline";
import { buildAutoHint, buildCorrectionHint } from "./response/hints";
import {
  appendInteraction,
  clearDisambiguation,
  getActiveMode,
  getDrillSession,
  getDrillSetup,
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
  setDrillSetup,
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
import { validateTopicSelection } from "./onboarding/topics";
import { logInteractionSafe } from "./storage/logging";
import { createLlmAdapter } from "./llm/factory";
import { generateResponse } from "./response/engine";
import { toToneMarks } from "./response/pinyin";
import { selectAllowedGrammar } from "./response/grammar";
import { initBudget } from "./llm/manager";
import {
  buildCompleteSentenceDrill,
  buildGrammarDrill,
  buildMicroDrill,
  buildReplySentenceDrill
} from "./drills/quick";
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
const PLACEMENT_ALIASES = new Set(["placement", "placement test", "start placement"]);
const SKIP_ALIASES = new Set(["skip", "skip placement"]);

type DrillFocus = "vocab" | "grammar" | "complete_sentence" | "reply_sentence";
type DrillType = DrillFocus;

const DRILL_ANY_TOPIC = "Any Topic";
const DRILL_TOPICS = [DRILL_ANY_TOPIC, ...listAllTopics(curriculum)];
const DRILL_FOCUS_OPTIONS: Array<{ id: DrillFocus; label: string }> = [
  { id: "grammar", label: "Grammar" },
  { id: "vocab", label: "Vocab Development" },
  { id: "complete_sentence", label: "Complete Sentence Practice" },
  { id: "reply_sentence", label: "Reply Sentence Practice" }
];
const DRILL_COUNT_OPTIONS = [5, 10, 20];

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
    keyboard.text(c, `disamb:${c}`).row();
  });
  return keyboard;
}

function buildDrillKeyboard(options: string[]): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  options.forEach((option, idx) => keyboard.text(option, "drill:" + idx).row());
  return keyboard;
}

function buildDrillTopicKeyboard(): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  DRILL_TOPICS.forEach((topic, idx) => {
    keyboard.text(topic, "drillsetup:topic:" + idx).row();
  });
  return keyboard;
}

function buildDrillFocusKeyboard(): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  DRILL_FOCUS_OPTIONS.forEach((focus) => {
    keyboard.text(focus.label, "drillsetup:focus:" + focus.id).row();
  });
  return keyboard;
}

function buildDrillCountKeyboard(): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  DRILL_COUNT_OPTIONS.forEach((count) => {
    keyboard.text(String(count), "drillsetup:count:" + count).row();
  });
  return keyboard;
}

function buildOnboardingKeyboard(): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  keyboard.text("Start Placement", "onboard:placement").row();
  keyboard.text("Skip", "onboard:skip");
  return keyboard;
}

function buildEntryMenuKeyboard(): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  keyboard.text("Placement (Recommended)", "menu:placement").row();
  keyboard.text("Start Drill", "menu:drill").row();
  keyboard.text("Advanced Free Chat", "menu:free_chat");
  return keyboard;
}
function buildReturnMenuKeyboard(): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  keyboard.text("Start Drill", "menu:drill").row();
  keyboard.text("Advanced Free Chat", "menu:free_chat").row();
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

function initDrillSession(total: number, focus: DrillFocus, topic: string) {
  return {
    total,
    remaining: total,
    correct: 0,
    items: [] as string[],
    topic,
    focus,
    askedByType: {
      vocab: 0,
      grammar: 0,
      complete_sentence: 0,
      reply_sentence: 0
    },
    wrongByType: {
      vocab: 0,
      grammar: 0,
      complete_sentence: 0,
      reply_sentence: 0
    },
    askedKeys: [],
    lastAskedKey: undefined
  };
}

function getFocusLabel(focus: DrillFocus): string {
  const found = DRILL_FOCUS_OPTIONS.find((f) => f.id === focus);
  return found ? found.label : focus;
}

async function sendDrillSetupTopic(ctx: any, userId: string): Promise<void> {
  setActiveMode(userId, "drill");
  setPendingDrill(userId, undefined);
  setDrillSession(userId, undefined);
  setDrillSetup(userId, { stage: "topic" });
  await ctx.reply("Drill setup (1/3): Choose a topic.", { reply_markup: buildDrillTopicKeyboard() });
}

async function sendDrillSetupFocus(ctx: any, userId: string, topic: string): Promise<void> {
  setDrillSetup(userId, { stage: "focus", topic });
  await ctx.reply(`Drill setup (2/3): Topic = ${topic}. Choose your focus area.`, {
    reply_markup: buildDrillFocusKeyboard()
  });
}

async function sendDrillSetupCount(ctx: any, userId: string, topic: string, focus: DrillFocus): Promise<void> {
  setDrillSetup(userId, { stage: "count", topic, focus });
  await ctx.reply(`Drill setup (3/3): Focus = ${getFocusLabel(focus)}. How many questions?`, {
    reply_markup: buildDrillCountKeyboard()
  });
}

function pickDrillByFocus(focus: DrillFocus, topic: string, excludeKeys?: Set<string>) {
  const scopedTopic = topic === DRILL_ANY_TOPIC ? undefined : topic;
  const options = { topic: scopedTopic, excludeKeys };
  if (focus === "vocab") return buildMicroDrill(curriculum, options);
  if (focus === "grammar") return buildGrammarDrill(curriculum, options);
  if (focus === "complete_sentence") return buildCompleteSentenceDrill(curriculum, options);
  return buildReplySentenceDrill(curriculum, options);
}

function pickAnyDrill(topic: string, excludeKeys?: Set<string>) {
  const scopedTopic = topic === DRILL_ANY_TOPIC ? undefined : topic;
  const options = { topic: scopedTopic, excludeKeys };
  return (
    buildMicroDrill(curriculum, options) ||
    buildGrammarDrill(curriculum, options) ||
    buildCompleteSentenceDrill(curriculum, options) ||
    buildReplySentenceDrill(curriculum, options)
  );
}

async function sendNextDrill(ctx: any, userId: string): Promise<void> {
  const session = getSession(userId);
  const drillSession = session.drillSession;
  if (!drillSession || drillSession.remaining <= 0) return;

  const asked = new Set(drillSession.askedKeys);
  let question = pickDrillByFocus(drillSession.focus, drillSession.topic, asked);

  if (!question) {
    question = pickAnyDrill(drillSession.topic, asked);
  }

  if (!question) {
    question = pickDrillByFocus(drillSession.focus, drillSession.topic);
  }

  if (!question) {
    question = pickAnyDrill(drillSession.topic);
  }

  if (!question) {
    await ctx.reply("No drills available yet for this selection.");
    setDrillSession(userId, undefined);
    setDrillSetup(userId, undefined);
    await sendReturnMenu(ctx, userId);
    return;
  }

  if (drillSession.lastAskedKey && question.key === drillSession.lastAskedKey) {
    const avoidLast = new Set(drillSession.askedKeys);
    avoidLast.add(drillSession.lastAskedKey);
    const alternate = pickDrillByFocus(drillSession.focus, drillSession.topic, avoidLast) || pickAnyDrill(drillSession.topic, avoidLast);
    if (alternate) question = alternate;
  }

  if (question.key) {
    drillSession.askedKeys.push(question.key);
    drillSession.lastAskedKey = question.key;
  }

  setPendingDrill(userId, question);
  await ctx.reply(question.prompt, { reply_markup: buildDrillKeyboard(question.options) });
}


async function startDrillSession(
  ctx: any,
  userId: string,
  config: { topic: string; focus: DrillFocus; total: number }
): Promise<void> {
  setActiveMode(userId, "drill");
  setDrillSetup(userId, undefined);
  setDrillSession(userId, initDrillSession(config.total, config.focus, config.topic));
  await ctx.reply(`Starting drill: ${getFocusLabel(config.focus)} · ${config.topic} · ${config.total} questions.`);
  await sendNextDrill(ctx, userId);
}

function buildDrillSummary(userId: string): string {
  const session = getDrillSession(userId);
  if (!session) return "Session complete.";

  const accuracy = session.total > 0 ? Math.round((session.correct / session.total) * 100) : 0;
  const items = session.items.slice(0, 6);
  const reviewedLine = items.length ? `Reviewed: ${items.join(" · ")}` : "Reviewed: (none)";

  const typeLabels: Record<DrillType, string> = {
    vocab: "Vocab",
    grammar: "Grammar",
    complete_sentence: "Complete Sentence",
    reply_sentence: "Reply Sentence"
  };

  const stats: string[] = [];
  let weakest: { type: DrillType; accuracy: number } | null = null;
  for (const type of Object.keys(session.askedByType) as DrillType[]) {
    const asked = session.askedByType[type];
    if (!asked) continue;
    const wrong = session.wrongByType[type];
    const correct = asked - wrong;
    const acc = Math.round((correct / asked) * 100);
    stats.push(typeLabels[type] + ": " + correct + "/" + asked + " (" + acc + "%)");
    if (!weakest || acc < weakest.accuracy) weakest = { type, accuracy: acc };
  }

  let lacking = "Good consistency across this drill set.";
  if (weakest !== null && weakest.accuracy < 80) {
    const weakestType = weakest.type;
    lacking = "Area to improve: " + typeLabels[weakestType] + " (" + weakest.accuracy + "%).";
  }

  const statsLine = stats.length ? `Breakdown: ${stats.join(" | ")}` : "Breakdown: (no stats)";
  return (
    `Session complete. Score: ${session.correct}/${session.total} (${accuracy}%).\n` +
    `${reviewedLine}\n` +
    `${statsLine}\n` +
    `${lacking}`
  );
}

async function finishDrillSession(ctx: any, userId: string): Promise<void> {
  const summary = buildDrillSummary(userId);
  await ctx.reply(summary);
  setDrillSession(userId, undefined);
  setDrillSetup(userId, undefined);
  await sendReturnMenu(ctx, userId);
}

function findVocabTarget(hanzi: string): { unit: CurriculumUnit; item: CurriculumItem } | null {
  for (const unit of curriculum.units) {
    const item = unit.vocab.find((v) => v.hanzi === hanzi);
    if (item) return { unit, item };
  }
  return null;
}

function findItemTarget(hanzi: string): { unit: CurriculumUnit; item: CurriculumItem } | null {
  for (const unit of curriculum.units) {
    const phrase = unit.phrases.find((p) => p.hanzi === hanzi);
    if (phrase) return { unit, item: phrase };
    const template = unit.templates.find((t) => t.hanzi === hanzi);
    if (template) return { unit, item: template };
    const vocab = unit.vocab.find((v) => v.hanzi === hanzi);
    if (vocab) return { unit, item: vocab };
  }
  return null;
}

function findGrammarTarget(hanzi: string): { unit: CurriculumUnit; item: GrammarItem } | null {
  for (const unit of curriculum.units) {
    const item = unit.grammar.find((g) => g.hanzi === hanzi);
    if (item) return { unit, item };
  }
  return null;
}

function findExampleForHanzi(hanzi: string): CurriculumItem | null {
  for (const unit of curriculum.units) {
    const template = unit.templates.find((t) => t.hanzi.includes(hanzi));
    if (template) return template;
    const phrase = unit.phrases.find((p) => p.hanzi.includes(hanzi));
    if (phrase) return phrase;
  }
  return null;
}

function findExampleForUnit(unit: CurriculumUnit): CurriculumItem | null {
  if (unit.templates.length) return unit.templates[0];
  if (unit.phrases.length) return unit.phrases[0];
  if (unit.vocab.length) return unit.vocab[0];
  return null;
}

function extractGrammarAnchors(hanzi: string): string[] {
  const anchors = hanzi.match(/[\u4e00-\u9fff]+/g) ?? [];
  const unique = Array.from(new Set(anchors));
  return unique.filter((token) => token.length >= 1);
}

function findExampleForGrammar(unit: CurriculumUnit, grammarHanzi: string): CurriculumItem | null {
  const anchors = extractGrammarAnchors(grammarHanzi);
  if (!anchors.length) return null;

  for (const anchor of anchors) {
    const template = unit.templates.find((t) => t.hanzi.includes(anchor));
    if (template) return template;
    const phrase = unit.phrases.find((p) => p.hanzi.includes(anchor));
    if (phrase) return phrase;
  }

  return null;
}

function findRelatedExampleForItem(unit: CurriculumUnit, excludeHanzi: string): CurriculumItem | null {
  const pool = [...unit.templates, ...unit.phrases].filter((item) => item.hanzi !== excludeHanzi);
  if (!pool.length) return null;
  return pool[0];
}

function buildDrillExplanation(drill: {
  type: string;
  target?: string;
  prompt: string;
  answer: string;
  context?: { promptMeaning?: string; promptHanzi?: string };
}): string {
  if (!drill.target) return "";

  if (drill.type === "grammar") {
    const found = findGrammarTarget(drill.target);
    if (!found) return "";

    const header = `${found.item.hanzi}\n${toToneMarks(found.item.pinyin)}\n${found.item.english}`;
    const why = drill.context?.promptMeaning
      ? `Why this is correct: it matches “${drill.context.promptMeaning}”.`
      : "Why this is correct: it matches the grammar meaning in the question.";

    const example = findExampleForGrammar(found.unit, found.item.hanzi);
    if (!example) {
      return `${header}\n\n${why}\n\nExample: (No direct sentence in curriculum for this grammar label yet.)`;
    }

    return `${header}\n\n${why}\n\nExample:\n${example.hanzi}\n${toToneMarks(example.pinyin)}\n${example.english}`;
  }

  const found = findItemTarget(drill.target);
  if (!found) return "";

  const header = `${found.item.hanzi}\n${toToneMarks(found.item.pinyin)}\n${found.item.english}`;
  const why = drill.context?.promptMeaning
    ? `Why this is correct: it means “${drill.context.promptMeaning}”.`
    : "Why this is correct: this option best matches the prompt.";

  if (drill.type === "complete_sentence" || drill.type === "reply_sentence") {
    const related = findRelatedExampleForItem(found.unit, found.item.hanzi);
    if (!related) {
      return `${header}\n\n${why}`;
    }
    return `${header}\n\n${why}\n\nRelated sentence:\n${related.hanzi}\n${toToneMarks(related.pinyin)}\n${related.english}`;
  }

  const example = findExampleForHanzi(found.item.hanzi);
  if (!example || example.hanzi === found.item.hanzi) {
    const fallbackPinyin = toToneMarks(`wo3 xi3 huan ${found.item.pinyin}`);
    return `${header}\n\n${why}\n\nExample:\n我喜欢${found.item.hanzi}\n${fallbackPinyin}\nI like ${found.item.english}`;
  }

  return `${header}\n\n${why}\n\nExample:\n${example.hanzi}\n${toToneMarks(example.pinyin)}\n${example.english}`;
}

function buildDrillFeedback(
  answer: string,
  drill: {
    type: string;
    target?: string;
    answer: string;
    prompt: string;
    context?: { promptMeaning?: string; promptHanzi?: string };
  },
  correct: boolean
): string {
  const status = correct ? "Correct!" : `Not quite. Correct answer: ${drill.answer}`;
  const selection = `You chose: ${answer}`;
  const explanation = buildDrillExplanation(drill);
  return explanation ? `${status}\n${selection}\n\n${explanation}` : `${status}\n${selection}`;
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
  await sendReturnMenu(ctx, from.id.toString());
});

bot.command("skip", async (ctx) => {
  const from = ctx.from;
  if (!from) return;
  setOnboardingComplete(from.id.toString(), true);
  stopPlacement(from.id.toString());
  await sendReturnMenu(ctx, from.id.toString());
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
  setOnboardingComplete(from.id.toString(), true);
  await sendDrillSetupTopic(ctx, from.id.toString());
});

bot.command("tone", async (ctx) => {
  await ctx.reply("Tone practice is now merged into Drill mode. Use /drill.");
});

bot.command("ping", (ctx) => ctx.reply("pong"));

bot.command("menu", async (ctx) => {
  const from = ctx.from;
  if (!from) return;
  await sendReturnMenu(ctx, from.id.toString());
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
      await sendDrillSetupTopic(ctx, userId);
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

  if (data.startsWith("drillsetup:")) {
    const userId = ctx.from?.id?.toString();
    if (!userId) return;
    await ctx.answerCallbackQuery();

    if (data.startsWith("drillsetup:topic:")) {
      const idx = parseInt(data.slice("drillsetup:topic:".length), 10);
      const topic = DRILL_TOPICS[idx] ?? DRILL_ANY_TOPIC;
      await sendDrillSetupFocus(ctx, userId, topic);
      return;
    }

    if (data.startsWith("drillsetup:focus:")) {
      const focusId = data.slice("drillsetup:focus:".length) as DrillFocus;
      if (!DRILL_FOCUS_OPTIONS.some((f) => f.id === focusId)) {
        await ctx.reply("Invalid focus selection. Please restart with /drill.");
        return;
      }
      const setup = getDrillSetup(userId);
      const topic = setup?.topic ?? DRILL_ANY_TOPIC;
      await sendDrillSetupCount(ctx, userId, topic, focusId);
      return;
    }

    if (data.startsWith("drillsetup:count:")) {
      const count = parseInt(data.slice("drillsetup:count:".length), 10);
      if (!DRILL_COUNT_OPTIONS.includes(count)) {
        await ctx.reply("Invalid question count. Please restart with /drill.");
        return;
      }

      const setup = getDrillSetup(userId);
      const topic = setup?.topic ?? DRILL_ANY_TOPIC;
      const focus = setup?.focus ?? "vocab";
      setOnboardingComplete(userId, true);
      await startDrillSession(ctx, userId, { topic, focus, total: count });
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
    const answerKey = data.slice("drill:".length);
    const parsedIndex = parseInt(answerKey, 10);
    const answer = Number.isNaN(parsedIndex) ? answerKey : (drill.options[parsedIndex] ?? "");
    const correct = answer === drill.answer;
    setPendingDrill(userId, undefined);
    await ctx.answerCallbackQuery();
    const feedback = buildDrillFeedback(answer, drill, correct);
    await ctx.reply(feedback);

    const drillSession = getDrillSession(userId);
    if (drillSession) {
      drillSession.remaining -= 1;
      drillSession.askedByType[drill.type] += 1;
      if (correct) {
        drillSession.correct += 1;
      } else {
        drillSession.wrongByType[drill.type] += 1;
      }
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
    await sendDrillSetupTopic(ctx, userId);
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

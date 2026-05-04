import { LlmAdapter } from "../llm/adapter";
import { Curriculum, CurriculumItem, CurriculumUnit } from "./types";

export type ReviewSuggestion = {
  promptHanzi: string;
  promptPinyin: string;
  promptEnglish: string;
  replyHanzi: string;
  replyPinyin: string;
  replyEnglish: string;
  rationale: string;
  topic: string;
  level: string;
};

function pickRandom<T>(items: T[]): T | null {
  if (!items.length) return null;
  const idx = Math.floor(Math.random() * items.length);
  return items[idx];
}

type PairContext = {
  unit: CurriculumUnit;
  prompt: CurriculumItem;
  reply: CurriculumItem;
  rationale?: string;
};

function collectPairContexts(curriculum: Curriculum): PairContext[] {
  const out: PairContext[] = [];
  for (const unit of curriculum.units) {
    if (!unit.replyPairs.length) continue;
    const pool = [...unit.templates, ...unit.phrases];
    const byHanzi = new Map<string, CurriculumItem>();
    for (const item of pool) byHanzi.set(item.hanzi, item);

    for (const pair of unit.replyPairs) {
      const prompt = byHanzi.get(pair.promptHanzi);
      const reply = byHanzi.get(pair.replyHanzi);
      if (!prompt || !reply) continue;
      out.push({ unit, prompt, reply, rationale: pair.rationale });
    }
  }
  return out;
}

export function buildReviewGenerationCacheKey(s: {
  promptHanzi: string;
  topic: string;
  level: string;
}): string {
  return `review_generate|${s.level}|${s.topic}|${s.promptHanzi}`;
}

export async function generateReplyPairSuggestion(
  adapter: LlmAdapter,
  curriculum: Curriculum
): Promise<ReviewSuggestion | null> {
  const contexts = collectPairContexts(curriculum);
  const target = pickRandom(contexts);
  if (!target) return null;

  const prompt =
    "You generate ONE beginner-safe Mandarin reply pair suggestion in strict JSON.\n" +
    "Return JSON only with keys: reply_hanzi, reply_pinyin, reply_english, rationale.\n" +
    "Constraints:\n" +
    "- Keep reply short (<= 12 Hanzi).\n" +
    "- Must be a natural reply to the given prompt.\n" +
    "- Keep vocabulary near the same level.\n" +
    "- Use simplified Chinese and pinyin tone marks.\n" +
    `Topic: ${target.unit.topic}\n` +
    `Level: ${target.unit.level}\n` +
    `Prompt Hanzi: ${target.prompt.hanzi}\n` +
    `Prompt Pinyin: ${target.prompt.pinyin}\n` +
    `Prompt English: ${target.prompt.english}\n` +
    `Existing correct reply example: ${target.reply.hanzi} | ${target.reply.pinyin} | ${target.reply.english}\n` +
    "Do not repeat the existing reply exactly.\n";

  const response = await adapter.generate({ prompt, timeoutMs: 8000 });
  const text = response.text.trim();
  const jsonStart = text.indexOf("{");
  const jsonEnd = text.lastIndexOf("}");
  if (jsonStart < 0 || jsonEnd <= jsonStart) return null;

  try {
    const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1)) as {
      reply_hanzi?: string;
      reply_pinyin?: string;
      reply_english?: string;
      rationale?: string;
    };

    const replyHanzi = parsed.reply_hanzi?.trim() ?? "";
    const replyPinyin = parsed.reply_pinyin?.trim() ?? "";
    const replyEnglish = parsed.reply_english?.trim() ?? "";
    const rationale = parsed.rationale?.trim() ?? "";

    if (!replyHanzi || !replyPinyin || !replyEnglish) return null;
    if (replyHanzi === target.reply.hanzi) return null;

    return {
      promptHanzi: target.prompt.hanzi,
      promptPinyin: target.prompt.pinyin,
      promptEnglish: target.prompt.english,
      replyHanzi,
      replyPinyin,
      replyEnglish,
      rationale: rationale || "Natural response to the prompt intent.",
      topic: target.unit.topic,
      level: target.unit.level
    };
  } catch {
    return null;
  }
}

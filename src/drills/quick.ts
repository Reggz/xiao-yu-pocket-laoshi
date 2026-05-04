import { Curriculum, CurriculumItem, GrammarItem } from "../curriculum/types";

export type DrillType = "vocab" | "grammar" | "complete_sentence" | "reply_sentence";

export type DrillQuestion = {
  id: string;
  key: string;
  prompt: string;
  options: string[];
  answer: string;
  type: DrillType;
  target?: string;
  context?: {
    promptMeaning?: string;
    promptHanzi?: string;
  };
};

export type DrillBuildOptions = {
  topic?: string;
  excludeKeys?: Set<string>;
};

function pickRandom<T>(items: T[]): T | null {
  if (!items.length) return null;
  const idx = Math.floor(Math.random() * items.length);
  return items[idx];
}

function getUnits(curriculum: Curriculum, options?: DrillBuildOptions) {
  const topic = options?.topic?.trim();
  if (!topic) return curriculum.units;
  return curriculum.units.filter((u) => u.topic.toLowerCase() === topic.toLowerCase());
}

function collectVocab(curriculum: Curriculum, options?: DrillBuildOptions): CurriculumItem[] {
  const items: CurriculumItem[] = [];
  for (const unit of getUnits(curriculum, options)) {
    items.push(...unit.vocab);
  }
  return items;
}

function collectGrammar(curriculum: Curriculum, options?: DrillBuildOptions): GrammarItem[] {
  const items: GrammarItem[] = [];
  for (const unit of getUnits(curriculum, options)) {
    items.push(...unit.grammar);
  }
  return items;
}

function collectSentences(curriculum: Curriculum, options?: DrillBuildOptions): CurriculumItem[] {
  const items: CurriculumItem[] = [];
  for (const unit of getUnits(curriculum, options)) {
    items.push(...unit.phrases, ...unit.templates);
  }
  return items;
}

type ReplyPair = {
  prompt: CurriculumItem;
  reply: CurriculumItem;
};

function collectReplyPairs(curriculum: Curriculum, options?: DrillBuildOptions): ReplyPair[] {
  const pairs: ReplyPair[] = [];
  for (const unit of getUnits(curriculum, options)) {
    const src = unit.templates.length >= 2 ? unit.templates : unit.phrases;
    if (src.length < 2) continue;
    for (let i = 0; i < src.length - 1; i += 1) {
      pairs.push({ prompt: src[i], reply: src[i + 1] });
    }
  }
  return pairs;
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function isExcluded(key: string, options?: DrillBuildOptions): boolean {
  if (!options?.excludeKeys) return false;
  return options.excludeKeys.has(key);
}

export function buildMicroDrill(curriculum: Curriculum, options?: DrillBuildOptions): DrillQuestion | null {
  const items = collectVocab(curriculum, options);
  if (items.length < 4) return null;

  const candidates = items.filter((item) => !isExcluded(`vocab:${item.hanzi}`, options));
  const target = pickRandom(candidates.length ? candidates : items);
  if (!target) return null;

  const distractors = items.filter((i) => i.english !== target.english);
  const optionsSet = new Set<string>();
  optionsSet.add(target.english);
  while (optionsSet.size < 4) {
    const d = pickRandom(distractors);
    if (!d) break;
    optionsSet.add(d.english);
  }

  return {
    id: `micro_${Date.now()}`,
    key: `vocab:${target.hanzi}`,
    prompt: `What does “${target.hanzi}” mean?`,
    options: shuffle(Array.from(optionsSet)),
    answer: target.english,
    type: "vocab",
    target: target.hanzi,
    context: { promptMeaning: target.english }
  };
}

export function buildGrammarDrill(curriculum: Curriculum, options?: DrillBuildOptions): DrillQuestion | null {
  const items = collectGrammar(curriculum, options);
  if (items.length < 4) return null;

  const candidates = items.filter((item) => !isExcluded(`grammar:${item.hanzi}`, options));
  const target = pickRandom(candidates.length ? candidates : items);
  if (!target) return null;

  const distractors = items.filter((i) => i.hanzi !== target.hanzi);
  const optionsSet = new Set<string>();
  optionsSet.add(target.hanzi);
  while (optionsSet.size < 4) {
    const d = pickRandom(distractors);
    if (!d) break;
    optionsSet.add(d.hanzi);
  }

  return {
    id: `grammar_${Date.now()}`,
    key: `grammar:${target.hanzi}`,
    prompt: `Which grammar matches “${target.english}”?`,
    options: shuffle(Array.from(optionsSet)),
    answer: target.hanzi,
    type: "grammar",
    target: target.hanzi,
    context: { promptMeaning: target.english }
  };
}

export function buildCompleteSentenceDrill(curriculum: Curriculum, options?: DrillBuildOptions): DrillQuestion | null {
  const items = collectSentences(curriculum, options).filter((i) => i.english.length > 0);
  if (items.length < 4) return null;

  const candidates = items.filter((item) => !isExcluded(`sentence:${item.hanzi}`, options));
  const target = pickRandom(candidates.length ? candidates : items);
  if (!target) return null;

  const distractors = items.filter((i) => i.hanzi !== target.hanzi);
  const optionsSet = new Set<string>();
  optionsSet.add(target.hanzi);
  while (optionsSet.size < 4) {
    const d = pickRandom(distractors);
    if (!d) break;
    optionsSet.add(d.hanzi);
  }

  return {
    id: `sentence_${Date.now()}`,
    key: `sentence:${target.hanzi}`,
    prompt: `Which sentence means: “${target.english}”?`,
    options: shuffle(Array.from(optionsSet)),
    answer: target.hanzi,
    type: "complete_sentence",
    target: target.hanzi,
    context: { promptMeaning: target.english }
  };
}

export function buildReplySentenceDrill(curriculum: Curriculum, options?: DrillBuildOptions): DrillQuestion | null {
  const pairs = collectReplyPairs(curriculum, options);
  if (pairs.length < 4) return null;

  const candidates = pairs.filter((pair) => !isExcluded(`reply:${pair.prompt.hanzi}->${pair.reply.hanzi}`, options));
  const target = pickRandom(candidates.length ? candidates : pairs);
  if (!target) return null;

  const distractors = pairs.filter((p) => p.reply.hanzi !== target.reply.hanzi);
  const optionsSet = new Set<string>();
  optionsSet.add(target.reply.hanzi);
  while (optionsSet.size < 4) {
    const d = pickRandom(distractors);
    if (!d) break;
    optionsSet.add(d.reply.hanzi);
  }

  return {
    id: `reply_${Date.now()}`,
    key: `reply:${target.prompt.hanzi}->${target.reply.hanzi}`,
    prompt: `Choose the best reply to:\n${target.prompt.hanzi}`,
    options: shuffle(Array.from(optionsSet)),
    answer: target.reply.hanzi,
    type: "reply_sentence",
    target: target.reply.hanzi,
    context: {
      promptHanzi: target.prompt.hanzi,
      promptMeaning: target.prompt.english
    }
  };
}

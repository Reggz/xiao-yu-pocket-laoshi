import { Curriculum, CurriculumItem, GrammarItem } from "../curriculum/types";
import { extractToneNumber, toToneMarks } from "../response/pinyin";

export type DrillQuestion = {
  id: string;
  prompt: string;
  options: string[];
  answer: string;
  type: "vocab" | "grammar" | "tone";
  target?: string;
};

function pickRandom<T>(items: T[]): T | null {
  if (!items.length) return null;
  const idx = Math.floor(Math.random() * items.length);
  return items[idx];
}

function collectVocab(curriculum: Curriculum): CurriculumItem[] {
  const items: CurriculumItem[] = [];
  for (const unit of curriculum.units) {
    items.push(...unit.vocab);
  }
  return items;
}

function collectGrammar(curriculum: Curriculum): GrammarItem[] {
  const items: GrammarItem[] = [];
  for (const unit of curriculum.units) {
    items.push(...unit.grammar);
  }
  return items;
}

export function buildMicroDrill(curriculum: Curriculum): DrillQuestion | null {
  const items = collectVocab(curriculum);
  if (items.length < 4) return null;

  const target = pickRandom(items);
  if (!target) return null;

  const distractors = items.filter((i) => i.english !== target.english);
  const options = new Set<string>();
  options.add(target.english);
  while (options.size < 4) {
    const d = pickRandom(distractors);
    if (!d) break;
    options.add(d.english);
  }

  return {
    id: `micro_${Date.now()}`,
    prompt: `What does “${target.hanzi}” mean?`,
    options: Array.from(options),
    answer: target.english,
    type: "vocab",
    target: target.hanzi
  };
}

export function buildGrammarDrill(curriculum: Curriculum): DrillQuestion | null {
  const items = collectGrammar(curriculum);
  if (items.length < 4) return null;

  const target = pickRandom(items);
  if (!target) return null;

  const distractors = items.filter((i) => i.english !== target.english);
  const options = new Set<string>();
  options.add(target.hanzi);
  while (options.size < 4) {
    const d = pickRandom(distractors);
    if (!d) break;
    options.add(d.hanzi);
  }

  return {
    id: `grammar_${Date.now()}`,
    prompt: `Which grammar matches “${target.english}”?`,
    options: Array.from(options),
    answer: target.hanzi,
    type: "grammar",
    target: target.hanzi
  };
}

export function buildToneDrill(curriculum: Curriculum): DrillQuestion | null {
  const items = collectVocab(curriculum);
  if (!items.length) return null;
  const target = pickRandom(items);
  if (!target) return null;

  const tone = extractToneNumber(target.pinyin);
  if (!tone) return null;

  return {
    id: `tone_${Date.now()}`,
    prompt: `What tone is used in “${toToneMarks(target.pinyin)}” for “${target.hanzi}”?`,
    options: ["1", "2", "3", "4"],
    answer: tone,
    type: "tone",
    target: target.hanzi
  };
}

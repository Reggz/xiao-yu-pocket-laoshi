import { Curriculum, CurriculumItem } from "../curriculum/types";

export type DrillQuestion = {
  id: string;
  prompt: string;
  options: string[];
  answer: string;
};

function pickRandom<T>(items: T[]): T | null {
  if (!items.length) return null;
  const idx = Math.floor(Math.random() * items.length);
  return items[idx];
}

export function buildMicroDrill(curriculum: Curriculum): DrillQuestion | null {
  const items: CurriculumItem[] = [];
  for (const unit of curriculum.units) {
    items.push(...unit.vocab);
  }
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
    answer: target.english
  };
}

export function buildToneDrill(curriculum: Curriculum): DrillQuestion | null {
  const items: CurriculumItem[] = [];
  for (const unit of curriculum.units) {
    items.push(...unit.vocab);
  }
  if (!items.length) return null;
  const target = pickRandom(items);
  if (!target) return null;

  const match = target.pinyin.match(/[1-5]/);
  if (!match) return null;
  const tone = match[0];

  return {
    id: `tone_${Date.now()}`,
    prompt: `What tone is used in “${target.pinyin}” for “${target.hanzi}”?`,
    options: ["1", "2", "3", "4"],
    answer: tone
  };
}

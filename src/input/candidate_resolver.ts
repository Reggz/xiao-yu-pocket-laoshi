import { loadCurriculumFromFile } from "../curriculum/loader";
import { Curriculum } from "../curriculum/types";

export type CandidateIndex = {
  toneMap: Map<string, string[]>;
  plainMap: Map<string, string[]>;
};

function push(map: Map<string, string[]>, key: string, value: string): void {
  const existing = map.get(key) ?? [];
  if (!existing.includes(value)) {
    existing.push(value);
    map.set(key, existing);
  }
}

function stripToneNumbers(pinyin: string): string {
  return pinyin.replace(/[1-5]/g, "");
}

export function buildCandidateIndex(curriculum: Curriculum): CandidateIndex {
  const toneMap = new Map<string, string[]>();
  const plainMap = new Map<string, string[]>();

  for (const unit of curriculum.units) {
    const items = [...unit.vocab, ...unit.phrases, ...unit.templates];
    for (const item of items) {
      const toneKey = item.pinyin.toLowerCase().trim();
      const plainKey = stripToneNumbers(toneKey);
      push(toneMap, toneKey, item.hanzi);
      push(plainMap, plainKey, item.hanzi);
    }
  }

  return { toneMap, plainMap };
}

export function resolveCandidatesFromPinyin(
  canonicalPinyin: string,
  index: CandidateIndex
): string[] {
  const toneKey = canonicalPinyin.toLowerCase().trim();
  if (!toneKey) return [];

  const toneMatches = index.toneMap.get(toneKey);
  if (toneMatches && toneMatches.length) return toneMatches;

  const plainKey = stripToneNumbers(toneKey);
  return index.plainMap.get(plainKey) ?? [];
}

export function loadCandidateIndexFromSeed(): CandidateIndex {
  const curriculum = loadCurriculumFromFile("docs/curriculum_seed.md");
  return buildCandidateIndex(curriculum);
}

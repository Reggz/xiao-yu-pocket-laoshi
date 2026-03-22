import { Curriculum } from "../curriculum/types";
import { getUnitsByTopic, getUnitsForLevel } from "../curriculum/helpers";

export type TemplateResponse = {
  hanzi: string;
  pinyin: string;
  english: string;
};

function pickTemplateFromUnits(units: Curriculum["units"], rng: () => number): TemplateResponse | null {
  const templates = units.flatMap((unit) => unit.templates);
  if (templates.length === 0) return null;
  const selected = templates[Math.floor(rng() * templates.length)];
  return { hanzi: selected.hanzi, pinyin: selected.pinyin, english: selected.english };
}

export function pickTemplate(
  curriculum: Curriculum,
  allowedLevels: string[] = ["A0"],
  topics: string[] = [],
  topicBiasRatio = 0.7,
  rng: () => number = Math.random
): TemplateResponse | null {
  const levelUnits = getUnitsForLevel(curriculum, allowedLevels);
  const topicUnits = topics.length ? getUnitsByTopic({ units: levelUnits }, topics) : [];

  if (topicUnits.length && rng() < topicBiasRatio) {
    const fromTopics = pickTemplateFromUnits(topicUnits, rng);
    if (fromTopics) return fromTopics;
  }

  return pickTemplateFromUnits(levelUnits, rng);
}

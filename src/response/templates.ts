import { Curriculum } from "../curriculum/types";
import { getUnitsByTopic, getUnitsForLevel } from "../curriculum/helpers";

export type TemplateResponse = {
  hanzi: string;
  pinyin: string;
  english: string;
};

export function pickTemplateFromUnits(units: Curriculum["units"]): TemplateResponse | null {
  for (const unit of units) {
    if (unit.templates.length > 0) {
      const t = unit.templates[0];
      return { hanzi: t.hanzi, pinyin: t.pinyin, english: t.english };
    }
  }
  return null;
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
    const fromTopics = pickTemplateFromUnits(topicUnits);
    if (fromTopics) return fromTopics;
  }

  return pickTemplateFromUnits(levelUnits);
}

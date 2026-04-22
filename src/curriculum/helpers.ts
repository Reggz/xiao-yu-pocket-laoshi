import { Curriculum, CurriculumUnit } from "./types";

const LEVEL_SCORE: Record<string, number> = {
  A0: 0,
  A1: 1,
  "A1+": 1.5,
  A2: 2,
  "A2+": 2.5,
  B1: 3,
  "B1+": 3.5,
  B2: 4
};

function getLevelScore(level: string): number | null {
  const key = level.trim().toUpperCase();
  return key in LEVEL_SCORE ? LEVEL_SCORE[key] : null;
}

export function getUnitsByTopic(curriculum: Curriculum, topics: string[]): CurriculumUnit[] {
  if (!topics.length) return curriculum.units;
  const topicSet = new Set(topics.map((t) => t.toLowerCase()));
  return curriculum.units.filter((u) => topicSet.has(u.topic.toLowerCase()));
}

export function listAllTopics(curriculum: Curriculum): string[] {
  const set = new Set<string>();
  for (const unit of curriculum.units) {
    set.add(unit.topic);
  }
  return Array.from(set);
}

export function getUnitsForLevel(curriculum: Curriculum, allowedLevels: string[]): CurriculumUnit[] {
  if (!allowedLevels.length) return [];

  const exactSet = new Set(allowedLevels.map((l) => l.toUpperCase()));
  const scores = allowedLevels.map(getLevelScore).filter((v): v is number => v !== null);
  if (!scores.length) {
    return curriculum.units.filter((u) => exactSet.has(u.level.toUpperCase()));
  }

  const maxAllowed = Math.max(...scores);
  return curriculum.units.filter((u) => {
    const score = getLevelScore(u.level);
    if (score !== null) return score <= maxAllowed;
    return exactSet.has(u.level.toUpperCase());
  });
}

import { Curriculum, CurriculumUnit } from "./types";

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
  const levelSet = new Set(allowedLevels.map((l) => l.toUpperCase()));
  return curriculum.units.filter((u) => levelSet.has(u.level.toUpperCase()));
}

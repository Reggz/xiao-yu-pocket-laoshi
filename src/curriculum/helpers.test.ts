import { describe, it, expect } from "vitest";
import { loadCurriculumFromFile } from "./loader";
import { getUnitsByTopic, listAllTopics, getUnitsForLevel } from "./helpers";

describe("curriculum helpers", () => {
  it("lists topics and filters units", () => {
    const curriculum = loadCurriculumFromFile("docs/curriculum_seed.md");
    const topics = listAllTopics(curriculum);
    expect(topics.length).toBeGreaterThan(0);

    const subset = getUnitsByTopic(curriculum, [topics[0]]);
    expect(subset.length).toBeGreaterThan(0);
  });

  it("gates units by level", () => {
    const curriculum = loadCurriculumFromFile("docs/curriculum_seed.md");
    const a0Units = getUnitsForLevel(curriculum, ["A0"]);
    const a1Units = getUnitsForLevel(curriculum, ["A1"]);
    expect(a0Units.length).toBeGreaterThan(0);
    expect(a1Units.length).toBeGreaterThan(0);
  });
});

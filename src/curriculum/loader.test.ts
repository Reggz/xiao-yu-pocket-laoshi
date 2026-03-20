import { describe, it, expect } from "vitest";
import { loadCurriculumFromFile } from "./loader";

describe("curriculum loader", () => {
  it("loads units from the seed file", () => {
    const curriculum = loadCurriculumFromFile("docs/curriculum_seed.md");
    expect(curriculum.units.length).toBeGreaterThan(0);

    const first = curriculum.units[0];
    expect(first.title).toBeTruthy();
    expect(first.topic).toBeTruthy();
    expect(first.vocab.length).toBeGreaterThan(0);
    expect(first.grammar.length).toBeGreaterThan(0);
    expect(first.grammar[0].tier).toBeTruthy();
  });
});

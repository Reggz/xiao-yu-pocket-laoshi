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

  it("parses explicit reply pairs", () => {
    const curriculum = loadCurriculumFromFile("docs/curriculum_seed.md");
    const withPairs = curriculum.units.filter((u) => u.replyPairs.length > 0);
    expect(withPairs.length).toBeGreaterThan(0);
    expect(withPairs[0].replyPairs[0].promptHanzi).toBeTruthy();
    expect(withPairs[0].replyPairs[0].replyHanzi).toBeTruthy();
  });

  it("parses extended units through unit 30", () => {
    const curriculum = loadCurriculumFromFile("docs/curriculum_seed.md");
    expect(curriculum.units.length).toBe(30);
    expect(curriculum.units[29]?.title).toBe("Culture and Arts");
  });
});

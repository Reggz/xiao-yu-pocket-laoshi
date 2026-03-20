import { describe, it, expect } from "vitest";
import { loadCurriculumFromFile } from "../curriculum/loader";
import { pickTemplate } from "./templates";

describe("template picker", () => {
  it("returns a template", () => {
    const curriculum = loadCurriculumFromFile("docs/curriculum_seed.md");
    const res = pickTemplate(curriculum);
    expect(res).not.toBeNull();
  });
});

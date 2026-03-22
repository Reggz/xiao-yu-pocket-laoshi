import { describe, it, expect } from "vitest";
import { loadCurriculumFromFile } from "../curriculum/loader";
import { buildMicroDrill, buildToneDrill } from "./quick";

describe("quick drills", () => {
  const curriculum = loadCurriculumFromFile("docs/curriculum_seed.md");

  it("builds a micro drill", () => {
    const q = buildMicroDrill(curriculum);
    expect(q).not.toBeNull();
    expect(q?.options.length).toBeGreaterThanOrEqual(2);
  });

  it("builds a tone drill", () => {
    const q = buildToneDrill(curriculum);
    expect(q).not.toBeNull();
    expect(q?.options).toContain("1");
  });
});

import { describe, it, expect } from "vitest";
import { loadCurriculumFromFile } from "../curriculum/loader";
import { buildCompleteSentenceDrill, buildGrammarDrill, buildMicroDrill, buildReplySentenceDrill } from "./quick";

describe("quick drills", () => {
  const curriculum = loadCurriculumFromFile("docs/curriculum_seed.md");

  it("builds a vocab drill", () => {
    const q = buildMicroDrill(curriculum);
    expect(q).not.toBeNull();
    expect(q?.options.length).toBeGreaterThanOrEqual(2);
  });

  it("builds a grammar drill", () => {
    const q = buildGrammarDrill(curriculum);
    expect(q).not.toBeNull();
    expect(q?.type).toBe("grammar");
  });

  it("builds a complete sentence drill", () => {
    const q = buildCompleteSentenceDrill(curriculum);
    expect(q).not.toBeNull();
    expect(q?.type).toBe("complete_sentence");
  });

  it("builds a reply sentence drill", () => {
    const q = buildReplySentenceDrill(curriculum);
    expect(q).not.toBeNull();
    expect(q?.type).toBe("reply_sentence");
  });
});

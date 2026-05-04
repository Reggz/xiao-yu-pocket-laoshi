import { describe, it, expect } from "vitest";
import { loadCurriculumFromFile } from "../curriculum/loader";
import { buildCompleteSentenceDrill, buildGrammarDrill, buildMicroDrill, buildReplySentenceDrill } from "./quick";

describe("quick drills", () => {
  const curriculum = loadCurriculumFromFile("docs/curriculum_seed.md");

  it("builds a vocab drill", () => {
    const q = buildMicroDrill(curriculum);
    expect(q).not.toBeNull();
    expect(q?.options.length).toBeGreaterThanOrEqual(2);
    expect(q?.key).toMatch(/^vocab:/);
  });

  it("builds a grammar drill", () => {
    const q = buildGrammarDrill(curriculum);
    expect(q).not.toBeNull();
    expect(q?.type).toBe("grammar");
    expect(q?.key).toMatch(/^grammar:/);
  });

  it("builds a complete sentence drill", () => {
    const q = buildCompleteSentenceDrill(curriculum);
    expect(q).not.toBeNull();
    expect(q?.type).toBe("complete_sentence");
    expect(q?.context?.promptMeaning).toBeTruthy();
  });

  it("builds a reply sentence drill", () => {
    const q = buildReplySentenceDrill(curriculum);
    expect(q).not.toBeNull();
    expect(q?.type).toBe("reply_sentence");
    expect(q?.context?.promptHanzi).toBeTruthy();
  });

  it("respects exclude keys for vocab drills", () => {
    const first = buildMicroDrill(curriculum);
    expect(first).not.toBeNull();
    const second = buildMicroDrill(curriculum, { excludeKeys: new Set([first!.key]) });
    expect(second).not.toBeNull();
    expect(second?.key).not.toBe(first?.key);
  });

  it("respects exclude keys for grammar drills", () => {
    const first = buildGrammarDrill(curriculum);
    expect(first).not.toBeNull();
    const second = buildGrammarDrill(curriculum, { excludeKeys: new Set([first!.key]) });
    expect(second).not.toBeNull();
    expect(second?.key).not.toBe(first?.key);
  });
});

import { describe, it, expect } from "vitest";
import { MockLlmAdapter } from "../llm/adapter";
import { generateWithGuardrails } from "./llm";

const grammar = [
  { hanzi: "吗", pinyin: "ma", english: "question", tier: "critical" as const }
];

describe("llm response wrapper", () => {
  it("returns trimmed output", async () => {
    const adapter = new MockLlmAdapter();
    const text = await generateWithGuardrails(adapter, "你好", {
      allowedGrammar: grammar,
      allowOneNonCritical: true
    });
    expect(text.length).toBeGreaterThan(0);
  });
});

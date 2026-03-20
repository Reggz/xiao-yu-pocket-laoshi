import { describe, it, expect } from "vitest";
import { buildGrammarGuardrail, validateGrammarUsage, selectAllowedGrammar } from "./grammar";
import type { GrammarItem } from "../curriculum/types";

describe("grammar guardrail", () => {
  const items: GrammarItem[] = [
    { hanzi: "吗", pinyin: "ma", english: "question", tier: "critical" },
    { hanzi: "因为", pinyin: "yinwei", english: "because", tier: "advanced" },
    { hanzi: "虽然", pinyin: "suiran", english: "although", tier: "advanced" }
  ];

  it("builds a guardrail prompt", () => {
    const rule = buildGrammarGuardrail(items, { allowOneNonCritical: true });
    expect(rule).toContain("吗");
  });

  it("validates grammar usage", () => {
    const ok = validateGrammarUsage([items[0]], { allowOneNonCritical: false });
    expect(ok.ok).toBe(true);

    const okOne = validateGrammarUsage([items[0], items[1]], { allowOneNonCritical: true });
    expect(okOne.ok).toBe(true);

    const bad = validateGrammarUsage([items[1], items[2]], { allowOneNonCritical: true });
    expect(bad.ok).toBe(false);
  });

  it("selects allowed tiers", () => {
    const allowed = selectAllowedGrammar(items, ["critical"]);
    expect(allowed.length).toBe(1);
  });
});

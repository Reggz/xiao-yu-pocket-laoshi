import { describe, it, expect } from "vitest";
import { loadCandidateIndexFromSeed, resolveCandidatesFromPinyin } from "./candidate_resolver";

const index = loadCandidateIndexFromSeed();

describe("candidate resolver", () => {
  it("resolves candidates for tone pinyin", () => {
    const candidates = resolveCandidatesFromPinyin("ni3 hao3", index);
    expect(candidates).toContain("你好");
  });

  it("resolves candidates for tone-mark pinyin", () => {
    const candidates = resolveCandidatesFromPinyin("nǐ hǎo", index);
    expect(candidates).toContain("你好");
  });

  it("resolves candidates for plain pinyin", () => {
    const candidates = resolveCandidatesFromPinyin("ni hao", index);
    expect(candidates).toContain("你好");
  });
});

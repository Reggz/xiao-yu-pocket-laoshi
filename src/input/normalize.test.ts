import { describe, it, expect } from "vitest";
import { normalizeInput } from "./normalize";

const cases = [
  { input: "ni3hao3", pinyin: "ni3 hao3", missingTone: false },
  { input: "ni3 hao3", pinyin: "ni3 hao3", missingTone: false },
  { input: "ni hao", pinyin: "ni hao", missingTone: true },
  { input: "nihao", pinyin: "ni hao", missingTone: true },
  { input: "Nǐ hǎo", pinyin: "ni3 hao3", missingTone: false },
  { input: "你好", hanzi: "你好", missingTone: false },
  { input: "你好 ma", hanzi: "你好", pinyin: "ma", missingTone: true },
  { input: "ni hao 吗", hanzi: "吗", pinyin: "ni hao", missingTone: true },
  { input: "你好🙂", hanzi: "你好", missingTone: false },
  { input: "wo jiao Sarah", pinyin: "wo jiao", missingTone: true }
];

describe("normalizeInput", () => {
  it("normalizes core pinyin variants", () => {
    for (const c of cases) {
      const res = normalizeInput(c.input);
      if (c.pinyin) expect(res.canonicalPinyin).toBe(c.pinyin);
      if (c.hanzi) expect(res.hanzi).toBe(c.hanzi);
      expect(res.missingTone).toBe(c.missingTone);
    }
  });
});

import { describe, it, expect } from "vitest";
import { loadCurriculumFromFile } from "../curriculum/loader";
import { Curriculum } from "../curriculum/types";
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

  it("builds a reply sentence drill from explicit reply pairs", () => {
    const q = buildReplySentenceDrill(curriculum);
    expect(q).not.toBeNull();
    expect(q?.type).toBe("reply_sentence");
    expect(q?.context?.promptHanzi).toBeTruthy();
    expect(q?.context?.answerMeaning).toBeTruthy();
  });

  it("does not infer reply pairs from adjacency when replyPairs is empty", () => {
    const tiny: Curriculum = {
      units: [
        {
          title: "Tiny",
          topic: "Test",
          level: "A0",
          vocab: [],
          phrases: [
            { hanzi: "你好吗？", pinyin: "nǐ hǎo ma", english: "how are you" },
            { hanzi: "我很好。", pinyin: "wǒ hěn hǎo", english: "I am good" }
          ],
          templates: [
            { hanzi: "你今天忙吗？", pinyin: "nǐ jīn tiān máng ma", english: "are you busy today" },
            { hanzi: "我今天不忙。", pinyin: "wǒ jīn tiān bù máng", english: "I am not busy today" }
          ],
          grammar: [
            { hanzi: "吗问句", pinyin: "ma", english: "yes no question", tier: "critical" }
          ],
          replyPairs: []
        }
      ]
    };

    const q = buildReplySentenceDrill(tiny);
    expect(q).toBeNull();
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

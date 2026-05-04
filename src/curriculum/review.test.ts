import { describe, it, expect } from "vitest";
import { LlmAdapter } from "../llm/adapter";
import { loadCurriculumFromFile } from "./loader";
import { buildReviewGenerationCacheKey, generateReplyPairSuggestion } from "./review";

class JsonAdapter implements LlmAdapter {
  async generate(): Promise<{ text: string }> {
    return {
      text: JSON.stringify({
        reply_hanzi: "我会多喝水。",
        reply_pinyin: "wǒ huì duō hē shuǐ",
        reply_english: "I will drink more water.",
        rationale: "It acknowledges and follows the advice."
      })
    };
  }
}

describe("curriculum review generation", () => {
  it("builds stable cache keys", () => {
    const key = buildReviewGenerationCacheKey({
      promptHanzi: "你今天吃什么？",
      topic: "Food/Drink",
      level: "A0"
    });
    expect(key).toBe("review_generate|A0|Food/Drink|你今天吃什么？");
  });

  it("generates a suggestion from reply-pair context", async () => {
    const curriculum = loadCurriculumFromFile("docs/curriculum_seed.md");
    const suggestion = await generateReplyPairSuggestion(new JsonAdapter(), curriculum);
    expect(suggestion).not.toBeNull();
    expect(suggestion?.promptHanzi).toBeTruthy();
    expect(suggestion?.replyHanzi).toBe("我会多喝水。");
    expect(suggestion?.rationale.length).toBeGreaterThan(0);
  });
});

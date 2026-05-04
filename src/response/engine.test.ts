import { describe, it, expect } from "vitest";
import { generateResponse } from "./engine";
import { MockLlmAdapter } from "../llm/adapter";
import { loadCurriculumFromFile } from "../curriculum/loader";

const curriculum = loadCurriculumFromFile("docs/curriculum_seed.md");

const baseContext = {
  curriculum,
  allowedLevels: ["A0"],
  topics: [],
  topicBiasRatio: 0.7,
  grammar: [],
  conversation: [],
  budget: { maxCallsPerSession: 1, callsUsed: 0 },
  llmPolicy: { maxCallsPerSession: 1, disableCaps: false }
};

describe("response engine", () => {
  it("falls back when LLM not provided", async () => {
    const res = await generateResponse(null, "ni hao", baseContext);
    expect(res.usedLlm).toBe(false);
    expect(res.text.length).toBeGreaterThan(0);
  });

  it("uses LLM when available and budget allows", async () => {
    const res = await generateResponse(new MockLlmAdapter(), "ni hao", baseContext);
    expect(res.usedLlm).toBe(true);
  });

  it("falls back when caps reached", async () => {
    const capped = { ...baseContext, budget: { maxCallsPerSession: 1, callsUsed: 1 } };
    const res = await generateResponse(new MockLlmAdapter(), "ni hao", capped);
    expect(res.usedLlm).toBe(false);
  });

  it("uses cache hit before calling llm", async () => {
    const cache = {
      async get() {
        return "缓存命中\nhuǎn cún mìng zhòng\ncache hit";
      },
      async set() {
        return;
      }
    };
    const res = await generateResponse(new MockLlmAdapter(), "ni hao", { ...baseContext, cache });
    expect(res.fromCache).toBe(true);
    expect(res.usedLlm).toBe(false);
    expect(res.text).toContain("cache hit");
  });
});

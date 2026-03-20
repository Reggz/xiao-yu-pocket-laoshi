import { describe, it, expect } from "vitest";
import { canUseLlm, recordLlmUse } from "./throttle";

describe("llm throttling", () => {
  it("enforces max calls", () => {
    let budget = { maxCallsPerSession: 1, callsUsed: 0 };
    expect(canUseLlm(budget)).toBe(true);
    budget = recordLlmUse(budget);
    expect(canUseLlm(budget)).toBe(false);
  });
});

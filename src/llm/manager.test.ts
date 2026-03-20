import { describe, it, expect } from "vitest";
import { initBudget, shouldUseLlm, consumeLlm } from "./manager";

describe("llm manager", () => {
  it("respects caps by default", () => {
    const budget = initBudget({ maxCallsPerSession: 1, disableCaps: false });
    expect(shouldUseLlm({ maxCallsPerSession: 1, disableCaps: false }, budget)).toBe(true);
    const used = consumeLlm({ maxCallsPerSession: 1, disableCaps: false }, budget);
    expect(shouldUseLlm({ maxCallsPerSession: 1, disableCaps: false }, used)).toBe(false);
  });

  it("bypasses caps when disabled", () => {
    const budget = initBudget({ maxCallsPerSession: 1, disableCaps: true });
    expect(shouldUseLlm({ maxCallsPerSession: 1, disableCaps: true }, budget)).toBe(true);
    const used = consumeLlm({ maxCallsPerSession: 1, disableCaps: true }, budget);
    expect(shouldUseLlm({ maxCallsPerSession: 1, disableCaps: true }, used)).toBe(true);
  });
});

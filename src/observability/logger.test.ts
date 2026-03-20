import { describe, it, expect, vi } from "vitest";
import { emitLog } from "./logger";

describe("logger", () => {
  it("emits a json line", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    emitLog({
      timestamp: new Date().toISOString(),
      requestId: "r1",
      sessionId: "s1",
      userId: "u1",
      mode: "free_text",
      level: "A0",
      inputLength: 1,
      outputLength: 1,
      llmTokensIn: 0,
      llmTokensOut: 0,
      llmCostUsd: 0,
      latencyMs: 10,
      llmLatencyMs: 0,
      safetyEvent: false
    });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

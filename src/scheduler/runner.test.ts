import { describe, it, expect } from "vitest";
import { evaluateCheckin } from "./runner";

describe("scheduler runner", () => {
  it("skips check-in if user initiated", () => {
    const res = evaluateCheckin({ time: "08:00", userInitiated: true });
    expect(res.shouldSend).toBe(false);
  });
});

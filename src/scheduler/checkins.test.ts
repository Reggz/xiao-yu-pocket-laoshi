import { describe, it, expect } from "vitest";
import { shouldSendCheckin } from "./checkins";
import { getWindowForTime } from "./windows";

describe("check-in rules", () => {
  it("skips when user initiated", () => {
    const window = getWindowForTime("08:00");
    const res = shouldSendCheckin(window, true);
    expect(res.shouldSend).toBe(false);
  });

  it("sends when scheduled and not user initiated", () => {
    const window = getWindowForTime("08:00");
    const res = shouldSendCheckin(window, false);
    expect(res.shouldSend).toBe(true);
  });
});

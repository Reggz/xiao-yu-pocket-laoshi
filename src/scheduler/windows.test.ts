import { describe, it, expect } from "vitest";
import { getWindowForTime } from "./windows";

describe("session windows", () => {
  it("maps time to window", () => {
    expect(getWindowForTime("06:30")?.name).toBe("morning");
    expect(getWindowForTime("12:30")?.name).toBe("afternoon");
    expect(getWindowForTime("20:00")?.name).toBe("evening");
  });
});

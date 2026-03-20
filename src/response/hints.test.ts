import { describe, it, expect } from "vitest";
import { buildAutoHint, buildCorrectionHint } from "./hints";

describe("hints", () => {
  it("builds auto hint", () => {
    const hint = buildAutoHint("fried rice", "炒饭", "chao3 fan4");
    expect(hint.message).toContain("炒饭");
  });

  it("builds correction hint", () => {
    const hint = buildCorrectionHint("我脚", "我叫", "脚 means feet.");
    expect(hint.message).toContain("我叫");
  });
});

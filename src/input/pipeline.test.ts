import { describe, it, expect } from "vitest";
import { runInputPipeline } from "./pipeline";

describe("input pipeline", () => {
  it("detects English hints for known glossary terms", () => {
    const res = runInputPipeline("I like fried rice");
    const hint = res.englishHints.find((h) => h.english.toLowerCase() === "fried rice");
    expect(hint).toBeTruthy();
    expect(hint?.hanzi).toBe("炒饭");
  });
});

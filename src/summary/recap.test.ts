import { describe, it, expect } from "vitest";
import { buildRecap } from "./recap";

describe("session recap", () => {
  it("formats recap", () => {
    const text = buildRecap({
      correct: ["你好"],
      errors: ["叫"],
      newVocab: ["炒饭"],
      nextDue: ["吃"]
    });
    expect(text).toContain("Correct");
  });
});

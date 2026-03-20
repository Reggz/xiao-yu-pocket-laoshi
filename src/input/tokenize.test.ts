import { describe, it, expect } from "vitest";
import { tokenize } from "./tokenize";

const input = "你好 ni3hao3! 我很好🙂";

describe("tokenize", () => {
  it("tokenizes mixed input", () => {
    const tokens = tokenize(input);
    expect(tokens.length).toBeGreaterThan(0);
    expect(tokens.some((t) => t.type === "hanzi")).toBe(true);
    expect(tokens.some((t) => t.type === "latin")).toBe(true);
  });
});

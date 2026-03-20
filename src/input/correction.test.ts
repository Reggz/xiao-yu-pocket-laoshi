import { describe, it, expect } from "vitest";
import { suggestCloseMatches } from "./correction";

describe("close match correction", () => {
  it("suggests close match for common confusion", () => {
    const vocab = ["ming", "zi", "jiao", "hao"];
    const suggestions = suggestCloseMatches("zhi", vocab);
    expect(suggestions).toContain("zi");
  });

  it("does not suggest when far", () => {
    const vocab = ["ming", "zi", "jiao", "hao"];
    const suggestions = suggestCloseMatches("xyz", vocab);
    expect(suggestions.length).toBe(0);
  });
});

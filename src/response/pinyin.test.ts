import { describe, it, expect } from "vitest";
import { toToneMarks, extractToneNumber } from "./pinyin";

describe("pinyin formatting", () => {
  it("converts tone numbers to tone marks", () => {
    expect(toToneMarks("ni3 hao3")).toBe("nǐ hǎo");
    expect(toToneMarks("Ni3 hao3")).toBe("Nǐ hǎo");
    expect(toToneMarks("chao3 fan4")).toBe("chǎo fàn");
  });

  it("leaves tone-mark pinyin unchanged", () => {
    expect(toToneMarks("Nǐ hǎo")).toBe("Nǐ hǎo");
  });

  it("extracts tone from marks or numbers", () => {
    expect(extractToneNumber("hao3")).toBe("3");
    expect(extractToneNumber("hǎo")).toBe("3");
  });
});

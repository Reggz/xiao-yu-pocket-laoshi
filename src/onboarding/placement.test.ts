import { describe, it, expect } from "vitest";
import { placementQuestions, scorePlacement, getPlacementQuestion } from "./placement";

describe("placement", () => {
  it("has 5 placement questions", () => {
    expect(placementQuestions.length).toBeGreaterThanOrEqual(5);
  });

  it("returns questions by index", () => {
    expect(getPlacementQuestion(0)).not.toBeNull();
    expect(getPlacementQuestion(99)).toBeNull();
  });

  it("scores placement correctly", () => {
    expect(scorePlacement(0)).toBe("A0");
    expect(scorePlacement(2)).toBe("A1");
    expect(scorePlacement(4)).toBe("A2");
  });
});

import { describe, it, expect } from "vitest";
import { availableTopics, normalizeTopic, validateTopicSelection } from "./topics";

describe("topic selection", () => {
  it("exposes a non-empty topic list", () => {
    expect(availableTopics.length).toBeGreaterThan(0);
  });

  it("normalizes topic names", () => {
    expect(normalizeTopic("food/drink")).toBe("Food/Drink");
    expect(normalizeTopic("unknown")).toBeNull();
  });

  it("limits selection to 3 topics", () => {
    const result = validateTopicSelection(["A", "B", "C", "D"]);
    expect(result.length).toBe(3);
  });
});

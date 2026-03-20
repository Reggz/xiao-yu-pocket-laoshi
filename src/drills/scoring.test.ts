import { describe, it, expect } from "vitest";
import { getModeWeight } from "./scoring";

describe("scoring weights", () => {
  it("assigns full weight to drills", () => {
    expect(getModeWeight("mcq")).toBe(1.0);
    expect(getModeWeight("fill_blank")).toBe(1.0);
    expect(getModeWeight("tone_selection")).toBe(1.0);
  });

  it("assigns partial weight to free text", () => {
    expect(getModeWeight("free_text")).toBeLessThan(1.0);
  });
});

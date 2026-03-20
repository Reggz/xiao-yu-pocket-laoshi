import { describe, it, expect } from "vitest";
import { menuOptions } from "./menu";

describe("menu options", () => {
  it("has menu items", () => {
    expect(menuOptions.length).toBeGreaterThan(0);
  });
});

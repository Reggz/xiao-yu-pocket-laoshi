import { describe, it, expect } from "vitest";
import { MockLlmAdapter } from "./adapter";

describe("llm adapter", () => {
  it("returns output for a mock adapter", async () => {
    const adapter = new MockLlmAdapter();
    const res = await adapter.generate({ prompt: "hello", timeoutMs: 1000 });
    expect(res.text).toContain("hello");
  });
});

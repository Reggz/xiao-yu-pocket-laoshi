import { describe, it, expect } from "vitest";
import { buildConversationBuffer } from "./buffer";

describe("conversation buffer", () => {
  it("limits by max turns and token budget", () => {
    const interactions = [
      { input: "hi", output: "hello" },
      { input: "how are you", output: "fine thanks" },
      { input: "what is your name", output: "xiao yu" }
    ];
    const buffer = buildConversationBuffer(interactions, 2, 6);
    expect(buffer.length).toBeLessThanOrEqual(2);
  });
});

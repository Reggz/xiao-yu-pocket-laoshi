import { describe, it, expect } from "vitest";
import {
  startDisambiguation,
  isDisambiguationExpired,
  resolveDisambiguation,
  DEFAULT_DISAMBIGUATION_TTL_MS
} from "./disambiguation";

describe("disambiguation", () => {
  it("enters awaiting state when ambiguous", () => {
    const res = startDisambiguation("shi", ["是", "十", "时"], Date.now());
    expect(res.state).not.toBeNull();
    expect(res.state?.candidates.length).toBe(3);
  });

  it("does not enter state when single candidate", () => {
    const res = startDisambiguation("ni3 hao3", ["你好"], Date.now());
    expect(res.state).toBeNull();
  });

  it("resolves selection and resets", () => {
    const now = Date.now();
    const res = startDisambiguation("shi", ["是", "十", "时"], now);
    const selected = resolveDisambiguation(res.state!, "是");
    expect(selected).toBe("是");
  });

  it("expires after ttl", () => {
    const now = Date.now();
    const res = startDisambiguation("shi", ["是", "十", "时"], now);
    const expired = isDisambiguationExpired(res.state!, now + DEFAULT_DISAMBIGUATION_TTL_MS + 1);
    expect(expired).toBe(true);
  });
});

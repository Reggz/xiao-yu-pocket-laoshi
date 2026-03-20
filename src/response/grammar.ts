import { GrammarItem, GrammarTier } from "../curriculum/types";

export type GrammarPolicy = {
  allowOneNonCritical: boolean;
};

export function buildGrammarGuardrail(allowed: GrammarItem[], policy: GrammarPolicy): string {
  const allowedNames = allowed.map((g) => g.hanzi).join(", ");
  const rule = policy.allowOneNonCritical
    ? "Allow at most one non-critical grammar per response."
    : "Use only critical grammar.";
  return `Allowed grammar: ${allowedNames}. ${rule} Avoid complex conjunctions.`;
}

export function validateGrammarUsage(
  used: GrammarItem[],
  policy: GrammarPolicy
): { ok: boolean; reason?: string } {
  const nonCriticalCount = used.filter((g) => g.tier !== "critical").length;
  if (policy.allowOneNonCritical && nonCriticalCount <= 1) return { ok: true };
  if (!policy.allowOneNonCritical && nonCriticalCount === 0) return { ok: true };
  return { ok: false, reason: "too_many_non_critical" };
}

export function selectAllowedGrammar(
  items: GrammarItem[],
  tiers: GrammarTier[]
): GrammarItem[] {
  const tierSet = new Set(tiers);
  return items.filter((g) => tierSet.has(g.tier));
}

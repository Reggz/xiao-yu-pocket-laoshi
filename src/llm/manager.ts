import { Budget, canUseLlm, recordLlmUse } from "./throttle";

export type LlmPolicy = {
  maxCallsPerSession: number;
  disableCaps: boolean;
};

export function initBudget(policy: LlmPolicy): Budget {
  return { maxCallsPerSession: policy.maxCallsPerSession, callsUsed: 0 };
}

export function shouldUseLlm(policy: LlmPolicy, budget: Budget): boolean {
  if (policy.disableCaps) return true;
  return canUseLlm(budget);
}

export function consumeLlm(policy: LlmPolicy, budget: Budget): Budget {
  if (policy.disableCaps) return budget;
  return recordLlmUse(budget);
}

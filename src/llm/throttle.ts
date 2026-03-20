export type Budget = {
  maxCallsPerSession: number;
  callsUsed: number;
};

export function canUseLlm(budget: Budget): boolean {
  return budget.callsUsed < budget.maxCallsPerSession;
}

export function recordLlmUse(budget: Budget): Budget {
  return { ...budget, callsUsed: budget.callsUsed + 1 };
}

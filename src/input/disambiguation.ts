export type DisambiguationState = {
  pendingInput: string;
  candidates: string[];
  createdAt: number;
};

export type DisambiguationResult = {
  state: DisambiguationState | null;
  prompt: string | null;
};

export const DEFAULT_DISAMBIGUATION_TTL_MS = 5 * 60 * 1000;

export function startDisambiguation(pendingInput: string, candidates: string[], nowMs: number): DisambiguationResult {
  if (candidates.length <= 1) {
    return { state: null, prompt: null };
  }
  const state: DisambiguationState = { pendingInput, candidates, createdAt: nowMs };
  return {
    state,
    prompt: "Did you mean one of these?"
  };
}

export function isDisambiguationExpired(state: DisambiguationState, nowMs: number, ttlMs = DEFAULT_DISAMBIGUATION_TTL_MS): boolean {
  return nowMs - state.createdAt > ttlMs;
}

export function resolveDisambiguation(state: DisambiguationState, selection: string): string | null {
  if (!state.candidates.includes(selection)) return null;
  return selection;
}

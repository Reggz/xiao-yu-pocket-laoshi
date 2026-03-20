export type InteractionSnippet = {
  input: string;
  output: string;
};

function estimateTokens(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

export function buildConversationBuffer(
  interactions: InteractionSnippet[],
  maxTurns: number,
  maxTokens: number
): InteractionSnippet[] {
  const recent = interactions.slice(-maxTurns);
  const result: InteractionSnippet[] = [];
  let usedTokens = 0;

  for (let i = recent.length - 1; i >= 0; i -= 1) {
    const item = recent[i];
    const tokens = estimateTokens(item.input) + estimateTokens(item.output);
    if (usedTokens + tokens > maxTokens) {
      continue;
    }
    result.unshift(item);
    usedTokens += tokens;
  }

  return result;
}

import { LlmAdapter } from "../llm/adapter";
import { buildGrammarGuardrail, validateGrammarUsage, selectAllowedGrammar } from "./grammar";
import { GrammarItem } from "../curriculum/types";

export type LlmResponseOptions = {
  allowedGrammar: GrammarItem[];
  allowOneNonCritical: boolean;
};

export async function generateWithGuardrails(
  adapter: LlmAdapter,
  prompt: string,
  options: LlmResponseOptions
): Promise<string> {
  const rule = buildGrammarGuardrail(options.allowedGrammar, {
    allowOneNonCritical: options.allowOneNonCritical
  });
  const response = await adapter.generate({ prompt: `${prompt}\n${rule}`, timeoutMs: 8000 });
  const used = selectAllowedGrammar(options.allowedGrammar, ["critical", "core", "advanced"]);
  const validation = validateGrammarUsage(used, { allowOneNonCritical: options.allowOneNonCritical });
  if (!validation.ok) {
    throw new Error(`grammar_guardrail:${validation.reason}`);
  }
  return response.text.trim();
}

import { LlmAdapter, MockLlmAdapter } from "./adapter";
import { OpenAiAdapter } from "./openai";
import { Config } from "../config";

export type Provider = "openai" | "mock";

export function createLlmAdapter(config: Config): LlmAdapter {
  const provider = (config.llmProvider ?? "openai") as Provider;

  if (provider === "mock") {
    return new MockLlmAdapter();
  }

  if (!config.llmApiKey) {
    throw new Error("LLM_API_KEY is required for OpenAI provider");
  }

  return new OpenAiAdapter({
    apiKey: config.llmApiKey,
    model: config.llmModel ?? "gpt-4.1-mini",
    baseUrl: config.llmBaseUrl
  });
}

import { LlmAdapter, LlmRequest, LlmResponse } from "./adapter";

export type OpenAiConfig = {
  apiKey: string;
  model: string;
  baseUrl?: string;
};

export class OpenAiAdapter implements LlmAdapter {
  private apiKey: string;
  private model: string;
  private baseUrl: string;

  constructor(config: OpenAiConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model;
    this.baseUrl = config.baseUrl ?? "https://api.openai.com/v1";
  }

  async generate(request: LlmRequest): Promise<LlmResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), request.timeoutMs);

    try {
      const res = await fetch(`${this.baseUrl}/responses`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: this.model,
          input: request.prompt
        }),
        signal: controller.signal
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`OpenAI error ${res.status}: ${text}`);
      }

      const data = await res.json();
      const outputText = Array.isArray(data.output)
        ? data.output
            .flatMap((o: any) => o.content ?? [])
            .map((c: any) => c.text)
            .filter(Boolean)
            .join("")
        : "";

      return { text: outputText };
    } finally {
      clearTimeout(timeout);
    }
  }
}

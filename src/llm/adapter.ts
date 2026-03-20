export type LlmRequest = {
  prompt: string;
  timeoutMs: number;
};

export type LlmResponse = {
  text: string;
};

export interface LlmAdapter {
  generate(request: LlmRequest): Promise<LlmResponse>;
}

export class MockLlmAdapter implements LlmAdapter {
  async generate(request: LlmRequest): Promise<LlmResponse> {
    return { text: request.prompt.slice(0, 200) };
  }
}

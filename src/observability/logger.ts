export type LogEvent = {
  timestamp: string;
  requestId: string;
  sessionId: string;
  userId: string;
  mode: string;
  level: string;
  inputLength: number;
  outputLength: number;
  llmTokensIn: number;
  llmTokensOut: number;
  llmCostUsd: number;
  latencyMs: number;
  llmLatencyMs: number;
  safetyEvent: boolean;
  errorType?: string;
};

export function emitLog(event: LogEvent): void {
  const line = JSON.stringify(event);
  // eslint-disable-next-line no-console
  console.log(line);
}

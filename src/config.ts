export type Config = {
  telegramBotToken: string;
  databaseUrl: string;
  llmApiKey?: string;
  llmProvider?: string;
  llmModel?: string;
  llmBaseUrl?: string;
  llmDisableCaps?: boolean;
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function envBool(name: string, fallback = false): boolean {
  const value = process.env[name];
  if (!value) return fallback;
  return value.toLowerCase() === "true" || value === "1";
}

export function loadConfig(): Config {
  return {
    telegramBotToken: requireEnv("TELEGRAM_BOT_TOKEN"),
    databaseUrl: requireEnv("DATABASE_URL"),
    llmApiKey: process.env.LLM_API_KEY,
    llmProvider: process.env.LLM_PROVIDER,
    llmModel: process.env.LLM_MODEL,
    llmBaseUrl: process.env.LLM_BASE_URL,
    llmDisableCaps: envBool("LLM_DISABLE_CAPS", false)
  };
}

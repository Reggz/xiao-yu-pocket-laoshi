import { loadConfig } from "../src/config";
import { pingDatabase } from "../src/storage/health";
import { sendTelegramAlert } from "../src/notifications/telegram";

function extractHost(databaseUrl: string): string {
  try {
    const url = new URL(databaseUrl);
    return url.hostname;
  } catch {
    return "invalid_url";
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST" && req.method !== "GET") {
    res.statusCode = 405;
    res.end("Method Not Allowed");
    return;
  }

  const config = loadConfig();
  const host = extractHost(config.databaseUrl);

  try {
    await pingDatabase(config.databaseUrl);
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: true, host }));
  } catch (err: any) {
    await sendTelegramAlert(
      config.telegramBotToken,
      config.telegramAdminChatId,
      `Keepalive failed: ${err?.message ?? "unknown error"}`
    );
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: false, host, error: err?.message ?? "unknown error" }));
  }
}

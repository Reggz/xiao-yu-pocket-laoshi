import { loadConfig } from "../src/config";
import { pingDatabase } from "../src/storage/health";
import { sendTelegramAlert } from "../src/notifications/telegram";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST" && req.method !== "GET") {
    res.statusCode = 405;
    res.end("Method Not Allowed");
    return;
  }

  try {
    const config = loadConfig();
    await pingDatabase(config.databaseUrl);
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: true }));
  } catch (err: any) {
    const config = loadConfig();
    await sendTelegramAlert(
      config.telegramBotToken,
      config.telegramAdminChatId,
      `Keepalive failed: ${err?.message ?? "unknown error"}`
    );
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: false, error: err?.message ?? "unknown error" }));
  }
}

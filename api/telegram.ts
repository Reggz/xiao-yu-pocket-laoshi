import { bot, ensureBotInit } from "../src/bot";
import { IncomingMessage } from "http";

const seenUpdates = new Map<number, number>();
const DEDUP_TTL_MS = 5 * 60 * 1000;

function isDuplicate(updateId: number): boolean {
  const now = Date.now();
  for (const [id, ts] of seenUpdates.entries()) {
    if (now - ts > DEDUP_TTL_MS) seenUpdates.delete(id);
  }
  if (seenUpdates.has(updateId)) return true;
  seenUpdates.set(updateId, now);
  return false;
}

async function readBody(req: IncomingMessage): Promise<any> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end("Method Not Allowed");
    return;
  }

  try {
    await ensureBotInit();
    const body = req.body ?? (await readBody(req));
    if (!body) {
      res.statusCode = 400;
      res.end("Bad Request");
      return;
    }
    if (typeof body.update_id === "number" && isDuplicate(body.update_id)) {
      res.statusCode = 200;
      res.end("OK");
      return;
    }
    await bot.handleUpdate(body);
    res.statusCode = 200;
    res.end("OK");
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("telegram webhook error", err);
    res.statusCode = 500;
    res.end("Internal Error");
  }
}

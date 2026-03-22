import { bot } from "../src/bot";
import { IncomingMessage } from "http";

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
    const body = req.body ?? (await readBody(req));
    if (!body) {
      res.statusCode = 400;
      res.end("Bad Request");
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

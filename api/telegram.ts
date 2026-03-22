import { bot } from "../src/bot";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end("Method Not Allowed");
    return;
  }
  await bot.handleUpdate(req.body);
  res.statusCode = 200;
  res.end("OK");
}

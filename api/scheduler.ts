import { evaluateCheckin } from "../src/scheduler/runner";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST" && req.method !== "GET") {
    res.statusCode = 405;
    res.end("Method Not Allowed");
    return;
  }

  const time = req.query?.time ?? "08:00";
  const userInitiated = req.query?.userInitiated === "true";
  const decision = evaluateCheckin({ time, userInitiated });

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(decision));
}

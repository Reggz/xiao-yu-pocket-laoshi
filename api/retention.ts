import { Pool } from "pg";
import { loadConfig } from "../src/config";

let pool: Pool | null = null;

function getPool(databaseUrl: string): Pool {
  if (!pool) {
    pool = new Pool({ connectionString: databaseUrl });
  }
  return pool;
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST" && req.method !== "GET") {
    res.statusCode = 405;
    res.end("Method Not Allowed");
    return;
  }

  const secret = process.env.RETENTION_SECRET;
  const provided = req.headers?.["x-retention-secret"] ?? req.query?.secret;
  if (secret && provided !== secret) {
    res.statusCode = 401;
    res.end("Unauthorized");
    return;
  }

  const retentionDays = Number(process.env.INTERACTIONS_RETENTION_DAYS ?? 90);

  try {
    const config = loadConfig();
    const p = getPool(config.databaseUrl);
    const result = await p.query(
      `DELETE FROM interactions
       WHERE created_at < now() - ($1 || ' days')::interval`,
      [retentionDays]
    );

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: true, deleted: result.rowCount ?? 0, retentionDays }));
  } catch (err: any) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: false, error: err?.message ?? "unknown error" }));
  }
}

import { Pool } from "pg";

let pool: Pool | null = null;

function getPool(databaseUrl: string): Pool {
  if (!pool) {
    pool = new Pool({ connectionString: databaseUrl });
  }
  return pool;
}

export async function pingDatabase(databaseUrl: string): Promise<void> {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL missing");
  }
  const p = getPool(databaseUrl);
  await p.query("SELECT 1");
}

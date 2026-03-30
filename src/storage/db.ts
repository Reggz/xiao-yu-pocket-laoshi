import { Pool } from "pg";

let pool: Pool | null = null;

function getPool(databaseUrl: string): Pool {
  if (!pool) {
    pool = new Pool({ connectionString: databaseUrl });
  }
  return pool;
}

export type InteractionRecord = {
  telegramId: string;
  telegramHandle?: string;
  preferredName?: string;
  channel: string;
  type: string;
  mode: string;
  state: string;
  inputTextRaw: string;
  inputTextNormalized: string;
  inputPinyinNormalized: string;
  missingTone: boolean;
  outputText: string;
};

async function ensureUserId(
  databaseUrl: string,
  telegramId: string,
  telegramHandle?: string,
  preferredName?: string
): Promise<string> {
  const p = getPool(databaseUrl);
  const res = await p.query(
    `INSERT INTO users (telegram_id, telegram_handle, preferred_name, last_active_at)
     VALUES ($1,$2,$3, now())
     ON CONFLICT (telegram_id)
     DO UPDATE SET
       telegram_handle = COALESCE(EXCLUDED.telegram_handle, users.telegram_handle),
       preferred_name = COALESCE(users.preferred_name, EXCLUDED.preferred_name),
       last_active_at = now()
     RETURNING id`,
    [telegramId, telegramHandle ?? null, preferredName ?? null]
  );
  return res.rows[0].id as string;
}

export async function recordInteraction(databaseUrl: string, record: InteractionRecord): Promise<void> {
  if (!databaseUrl) return;
  const userId = await ensureUserId(
    databaseUrl,
    record.telegramId,
    record.telegramHandle,
    record.preferredName
  );
  const p = getPool(databaseUrl);
  await p.query(
    `INSERT INTO interactions
      (user_id, channel, type, mode, state, input_text_raw, input_text_normalized, input_pinyin_normalized, missing_tone, output_text)
     VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [
      userId,
      record.channel,
      record.type,
      record.mode,
      record.state,
      record.inputTextRaw,
      record.inputTextNormalized,
      record.inputPinyinNormalized,
      record.missingTone,
      record.outputText
    ]
  );
}

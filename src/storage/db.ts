import { Pool } from "pg";

let pool: Pool | null = null;

function getPool(databaseUrl: string): Pool {
  if (!pool) {
    pool = new Pool({ connectionString: databaseUrl });
  }
  return pool;
}

export type InteractionRecord = {
  userId: string;
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

export async function recordInteraction(databaseUrl: string, record: InteractionRecord): Promise<void> {
  if (!databaseUrl) return;
  const p = getPool(databaseUrl);
  await p.query(
    `INSERT INTO interactions
      (user_id, channel, type, mode, state, input_text_raw, input_text_normalized, input_pinyin_normalized, missing_tone, output_text)
     VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [
      record.userId,
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

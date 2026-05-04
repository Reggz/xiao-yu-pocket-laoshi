import { Pool } from "pg";

let pool: Pool | null = null;
let hybridTablesEnsured = false;

function getPool(databaseUrl: string): Pool {
  if (!pool) {
    pool = new Pool({ connectionString: databaseUrl });
  }
  return pool;
}

async function ensureHybridTables(databaseUrl: string): Promise<void> {
  if (!databaseUrl || hybridTablesEnsured) return;
  const p = getPool(databaseUrl);
  await p.query(`
    CREATE TABLE IF NOT EXISTS llm_cache (
      cache_key text PRIMARY KEY,
      kind text NOT NULL DEFAULT 'free_chat',
      content text NOT NULL,
      meta jsonb,
      hit_count int NOT NULL DEFAULT 0,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS curriculum_review_queue (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      source text NOT NULL,
      status text NOT NULL DEFAULT 'pending',
      prompt_hanzi text NOT NULL,
      prompt_pinyin text,
      prompt_english text,
      reply_hanzi text NOT NULL,
      reply_pinyin text,
      reply_english text,
      rationale text,
      topic text,
      level text,
      raw_payload jsonb,
      reviewed_by text,
      reviewed_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  await p.query(`CREATE INDEX IF NOT EXISTS curriculum_review_queue_status_idx ON curriculum_review_queue(status, created_at)`);
  hybridTablesEnsured = true;
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

export async function getCachedLlmContent(
  databaseUrl: string,
  cacheKey: string,
  kind = "free_chat"
): Promise<string | null> {
  if (!databaseUrl) return null;
  await ensureHybridTables(databaseUrl);
  const p = getPool(databaseUrl);
  const res = await p.query(
    `UPDATE llm_cache
     SET hit_count = hit_count + 1, updated_at = now()
     WHERE cache_key = $1 AND kind = $2
     RETURNING content`,
    [cacheKey, kind]
  );
  if (res.rowCount && res.rowCount > 0) {
    return (res.rows[0].content as string) ?? null;
  }
  return null;
}

export async function upsertCachedLlmContent(
  databaseUrl: string,
  cacheKey: string,
  content: string,
  kind = "free_chat",
  meta: Record<string, unknown> | null = null
): Promise<void> {
  if (!databaseUrl || !content) return;
  await ensureHybridTables(databaseUrl);
  const p = getPool(databaseUrl);
  await p.query(
    `INSERT INTO llm_cache (cache_key, kind, content, meta)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (cache_key)
     DO UPDATE SET
       kind = EXCLUDED.kind,
       content = EXCLUDED.content,
       meta = EXCLUDED.meta,
       updated_at = now()`,
    [cacheKey, kind, content, meta]
  );
}

export type CurriculumReviewItem = {
  id: string;
  source: string;
  status: string;
  promptHanzi: string;
  promptPinyin: string | null;
  promptEnglish: string | null;
  replyHanzi: string;
  replyPinyin: string | null;
  replyEnglish: string | null;
  rationale: string | null;
  topic: string | null;
  level: string | null;
  createdAt: string;
};

export type CreateCurriculumReviewItemInput = {
  source: "llm" | "manual";
  promptHanzi: string;
  promptPinyin?: string;
  promptEnglish?: string;
  replyHanzi: string;
  replyPinyin?: string;
  replyEnglish?: string;
  rationale?: string;
  topic?: string;
  level?: string;
  rawPayload?: Record<string, unknown>;
};

export async function enqueueCurriculumReviewItem(
  databaseUrl: string,
  input: CreateCurriculumReviewItemInput
): Promise<string | null> {
  if (!databaseUrl) return null;
  await ensureHybridTables(databaseUrl);
  const p = getPool(databaseUrl);
  const res = await p.query(
    `INSERT INTO curriculum_review_queue
      (source, prompt_hanzi, prompt_pinyin, prompt_english, reply_hanzi, reply_pinyin, reply_english, rationale, topic, level, raw_payload)
     VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING id`,
    [
      input.source,
      input.promptHanzi,
      input.promptPinyin ?? null,
      input.promptEnglish ?? null,
      input.replyHanzi,
      input.replyPinyin ?? null,
      input.replyEnglish ?? null,
      input.rationale ?? null,
      input.topic ?? null,
      input.level ?? null,
      input.rawPayload ?? null
    ]
  );
  return (res.rows[0]?.id as string) ?? null;
}

export async function listPendingCurriculumReview(
  databaseUrl: string,
  limit = 10
): Promise<CurriculumReviewItem[]> {
  if (!databaseUrl) return [];
  await ensureHybridTables(databaseUrl);
  const p = getPool(databaseUrl);
  const res = await p.query(
    `SELECT id, source, status,
            prompt_hanzi, prompt_pinyin, prompt_english,
            reply_hanzi, reply_pinyin, reply_english,
            rationale, topic, level, created_at
     FROM curriculum_review_queue
     WHERE status = 'pending'
     ORDER BY created_at ASC
     LIMIT $1`,
    [limit]
  );

  return res.rows.map((r) => ({
    id: r.id as string,
    source: r.source as string,
    status: r.status as string,
    promptHanzi: r.prompt_hanzi as string,
    promptPinyin: (r.prompt_pinyin as string | null) ?? null,
    promptEnglish: (r.prompt_english as string | null) ?? null,
    replyHanzi: r.reply_hanzi as string,
    replyPinyin: (r.reply_pinyin as string | null) ?? null,
    replyEnglish: (r.reply_english as string | null) ?? null,
    rationale: (r.rationale as string | null) ?? null,
    topic: (r.topic as string | null) ?? null,
    level: (r.level as string | null) ?? null,
    createdAt: (r.created_at as Date).toISOString()
  }));
}

export async function updateCurriculumReviewStatus(
  databaseUrl: string,
  id: string,
  status: "approved" | "rejected",
  reviewedBy: string
): Promise<boolean> {
  if (!databaseUrl || !id) return false;
  await ensureHybridTables(databaseUrl);
  const p = getPool(databaseUrl);
  const res = await p.query(
    `UPDATE curriculum_review_queue
     SET status = $2, reviewed_by = $3, reviewed_at = now()
     WHERE id = $1 AND status = 'pending'`,
    [id, status, reviewedBy]
  );
  return (res.rowCount ?? 0) > 0;
}

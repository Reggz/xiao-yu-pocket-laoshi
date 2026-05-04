CREATE TABLE IF NOT EXISTS llm_cache (
  cache_key text PRIMARY KEY,
  kind text NOT NULL DEFAULT 'free_chat',
  content text NOT NULL,
  meta jsonb,
  hit_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

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
);

CREATE INDEX IF NOT EXISTS curriculum_review_queue_status_idx
  ON curriculum_review_queue(status, created_at);

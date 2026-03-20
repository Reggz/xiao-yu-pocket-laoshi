CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timezone text,
  email text,
  phone_number text,
  telegram_handle text,
  preferred_name text,
  membership_status text DEFAULT 'free',
  subscription_tier text,
  created_at timestamptz DEFAULT now(),
  last_active_at timestamptz
);

CREATE TABLE IF NOT EXISTS user_settings (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  target_language text,
  source_language text,
  preferred_script text,
  daily_schedule jsonb,
  quiet_hours jsonb,
  mode_preferences jsonb,
  topic_bias_ratio numeric DEFAULT 0.7,
  session_windows jsonb,
  session_checkins jsonb
);

CREATE TABLE IF NOT EXISTS topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  level text
);

CREATE TABLE IF NOT EXISTS user_topics (
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  topic_id uuid REFERENCES topics(id) ON DELETE CASCADE,
  priority int,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, topic_id)
);

CREATE TABLE IF NOT EXISTS interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  channel text,
  type text,
  mode text,
  state text,
  input_text_raw text,
  input_text_normalized text,
  input_pinyin_normalized text,
  output_text text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS exploratory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  source_text text,
  suggested_hanzi text,
  suggested_pinyin text,
  suggested_english text,
  created_at timestamptz DEFAULT now(),
  promoted_to_item_id uuid
);

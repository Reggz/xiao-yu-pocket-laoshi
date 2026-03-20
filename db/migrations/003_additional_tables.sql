ALTER TABLE interactions
  ADD COLUMN IF NOT EXISTS missing_tone boolean;

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  provider text,
  status text,
  plan_id text,
  current_period_start timestamptz,
  current_period_end timestamptz
);

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid REFERENCES subscriptions(id) ON DELETE CASCADE,
  amount numeric,
  currency text,
  paid_at timestamptz,
  status text
);

CREATE TABLE IF NOT EXISTS curriculum_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level text,
  title text,
  description text
);

CREATE TABLE IF NOT EXISTS curriculum_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid REFERENCES curriculum_units(id) ON DELETE CASCADE,
  type text,
  hanzi text,
  pinyin text,
  english_gloss text,
  tags jsonb,
  grammar_patterns jsonb,
  unit_grammar jsonb,
  grammar_tier text
);

CREATE TABLE IF NOT EXISTS curriculum_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid REFERENCES curriculum_units(id) ON DELETE CASCADE,
  template_text text,
  template_pinyin text,
  english_gloss text,
  slot_schema jsonb
);

CREATE TABLE IF NOT EXISTS curriculum_drills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid REFERENCES curriculum_units(id) ON DELETE CASCADE,
  drill_type text,
  prompt text,
  choices jsonb,
  answer text
);

CREATE TABLE IF NOT EXISTS user_items (
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  item_id uuid REFERENCES curriculum_items(id) ON DELETE CASCADE,
  mastery_level int,
  seen_count int,
  correct_count int,
  last_seen_at timestamptz,
  next_due_at timestamptz,
  ease_factor numeric,
  PRIMARY KEY (user_id, item_id)
);

CREATE TABLE IF NOT EXISTS normalization_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interaction_id uuid REFERENCES interactions(id) ON DELETE CASCADE,
  candidate_hanzi text,
  candidate_pinyin text,
  confidence numeric,
  selected boolean
);

CREATE TABLE IF NOT EXISTS errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interaction_id uuid REFERENCES interactions(id) ON DELETE CASCADE,
  error_type text,
  details jsonb
);

CREATE TABLE IF NOT EXISTS onboarding_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  started_at timestamptz,
  completed_at timestamptz,
  correct_count int,
  placed_level text
);

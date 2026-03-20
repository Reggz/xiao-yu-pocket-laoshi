ALTER TABLE exploratory_items
  ADD COLUMN IF NOT EXISTS usage_count int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_triggered_at timestamptz;

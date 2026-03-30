ALTER TABLE users
  ADD COLUMN IF NOT EXISTS telegram_id text;

CREATE UNIQUE INDEX IF NOT EXISTS users_telegram_id_key
  ON users(telegram_id)
  WHERE telegram_id IS NOT NULL;

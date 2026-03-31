DROP INDEX IF EXISTS users_telegram_id_key;

CREATE UNIQUE INDEX users_telegram_id_key
  ON users(telegram_id);

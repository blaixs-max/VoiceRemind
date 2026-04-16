-- 002_add_is_important.sql
-- "Önemli" bayrağı: kullanıcı bir hatırlatıcıyı önemli olarak işaretleyebilir.
-- Idempotent: tekrar çalıştırmak güvenlidir.

ALTER TABLE reminders
  ADD COLUMN IF NOT EXISTS is_important BOOLEAN NOT NULL DEFAULT FALSE;

-- Önemli hatırlatıcılar filtresi için partial index (sadece true kayıtları indexler — hızlı ve küçük)
CREATE INDEX IF NOT EXISTS reminders_is_important_idx
  ON reminders (user_id, is_important)
  WHERE is_important = TRUE;

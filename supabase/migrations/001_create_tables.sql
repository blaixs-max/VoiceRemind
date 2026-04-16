-- VoiceRemind — Supabase DB Migration
-- Supabase Dashboard > SQL Editor'e yapistir ve calistir

-- 1. Contacts tablosu
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Reminders tablosu
CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  datetime TIMESTAMPTZ NOT NULL,
  remind_before INTEGER NOT NULL DEFAULT 0,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  notification_id TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'done', 'dismissed')),
  timezone TEXT NOT NULL DEFAULT 'Europe/Istanbul',
  source_text TEXT NOT NULL DEFAULT '',
  confidence REAL NOT NULL DEFAULT 1.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Indexler (performans)
CREATE INDEX IF NOT EXISTS idx_contacts_user ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_user ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_status ON reminders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_reminders_contact ON reminders(contact_id);

-- 4. Row Level Security (RLS)
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- Contacts RLS: kullanici sadece kendi carilerini gorur/yazar
CREATE POLICY "contacts_select" ON contacts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "contacts_insert" ON contacts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "contacts_update" ON contacts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "contacts_delete" ON contacts
  FOR DELETE USING (auth.uid() = user_id);

-- Reminders RLS: kullanici sadece kendi hatirlaticilarini gorur/yazar
CREATE POLICY "reminders_select" ON reminders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "reminders_insert" ON reminders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reminders_update" ON reminders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "reminders_delete" ON reminders
  FOR DELETE USING (auth.uid() = user_id);

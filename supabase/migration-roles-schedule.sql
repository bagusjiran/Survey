-- =============================================
-- Migration: Multi-admin roles + Agenda scheduling
-- Jalankan di Supabase SQL Editor
-- =============================================

-- 1. Tambah kolom role ke members
ALTER TABLE members ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member';

-- 2. Update existing admin accounts
UPDATE members SET role = 'super_admin' WHERE is_admin = true AND (role IS NULL OR role = 'member');

-- 3. Tambah kolom schedule ke agendas
ALTER TABLE agendas ADD COLUMN IF NOT EXISTS schedule_start TIMESTAMPTZ;
ALTER TABLE agendas ADD COLUMN IF NOT EXISTS schedule_end TIMESTAMPTZ;

-- 4. Index untuk scheduling query
CREATE INDEX IF NOT EXISTS idx_agendas_schedule_start ON agendas(schedule_start) WHERE schedule_start IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_agendas_schedule_end ON agendas(schedule_end) WHERE schedule_end IS NOT NULL;

-- 5. Verify
SELECT 'MEMBERS' as tabel, count(*) as jumlah FROM members
UNION ALL
SELECT 'AGENDAS', count(*) FROM agendas;

-- 6. Check roles
SELECT full_name, nim, role, is_admin FROM members ORDER BY role, full_name;

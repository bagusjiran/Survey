-- =============================================================
-- FIX & MIGRASI LENGKAP - Survey UKM Kerohanian Islam
-- Jalankan SELURUH script ini di Supabase SQL Editor
-- =============================================================

-- 1. Hapus test agenda yang tadi (jika ada)
DELETE FROM agendas WHERE title = 'Test';

-- 2. FIX: Tambah kolom event_date ke tabel agendas
ALTER TABLE agendas ADD COLUMN IF NOT EXISTS event_date DATE;

-- 3. FIX: Tambah kolom options ke tabel survey_questions
ALTER TABLE survey_questions ADD COLUMN IF NOT EXISTS options JSONB;

-- 4. FIX: Update CHECK constraint tipe pertanyaan (hapus 'yes_no', tambah 'radio')
ALTER TABLE survey_questions DROP CONSTRAINT IF EXISTS survey_questions_question_type_check;
ALTER TABLE survey_questions ADD CONSTRAINT survey_questions_question_type_check
  CHECK (question_type IN ('text', 'textarea', 'radio', 'rating'));

-- 5. FIX: Update UNIQUE constraint di survey_responses
ALTER TABLE survey_responses DROP CONSTRAINT IF EXISTS survey_responses_question_id_member_id_key;
ALTER TABLE survey_responses DROP CONSTRAINT IF EXISTS survey_responses_agenda_id_question_id_member_id_key;
ALTER TABLE survey_responses ADD CONSTRAINT survey_responses_unique
  UNIQUE (agenda_id, question_id, member_id);

-- 6. FIX: Hapus kolom admin_code dari members (tidak diperlukan, admin_code di .env)
ALTER TABLE members DROP COLUMN IF EXISTS admin_code;

-- 6b. FIX: UNIQUE constraint untuk mencegah double vote (race condition)
ALTER TABLE active_student_votes DROP CONSTRAINT IF EXISTS active_student_votes_agenda_id_voter_id_voted_for_id_key;
ALTER TABLE active_student_votes ADD CONSTRAINT active_student_votes_unique
  UNIQUE (agenda_id, voter_id, voted_for_id);

-- 7. FIX: Hapus kolom created_by dari agendas (tidak dipakai di kode)
-- ALTER TABLE agendas DROP COLUMN IF EXISTS created_by; -- opsional

-- 8. Hapus semua anggota lama KECUALI admin (NIM 24550011)
DELETE FROM members WHERE nim != '24550011';

-- 9. Insert semua anggota dari Excel (23 orang, admin sudah ada)
INSERT INTO members (full_name, nim, is_admin) VALUES
  ('Olivia Cahyani Agustina', '24550023', FALSE),
  ('Zifa Aulia Marfu''atun', '24150062', FALSE),
  ('Alfareza lail Ramadhan', '24550009', FALSE),
  ('Dhani', '24350019', FALSE),
  ('SITI NISRINA SABILLAHAQ', '25250022', FALSE),
  ('MUHAMMAD NURUL AHSIN', '25550025', FALSE),
  ('Angga Noval Herlianto', '25350061', FALSE),
  ('Dita Bayu Setiawan', '25250025', FALSE),
  ('Satria Fahri Arullah', '25550035', FALSE),
  ('Mutiara Ramadhani', '25550014', FALSE),
  ('Kirana Cinta Mentari', '25550012', FALSE),
  ('Kirani Cinta Mentari', '25550039', FALSE),
  ('Mun''im Abdulloh', '25350075', FALSE),
  ('Ilham Maulana rifqi', '25250020', FALSE),
  ('AFRI YULIANTO WIBOWO', '25250019', FALSE),
  ('ROFII ALAN NABIIH', '25250026', FALSE),
  ('ahmad syifa fatkhul aziz', '25350087', FALSE),
  ('FATONI AL HAFIZ', '25350091', FALSE),
  ('Ahmad Aldi Firmansyah', '25350071', FALSE),
  ('Kembang Cinta Pelangi', '25550038', FALSE),
  ('Ferdio Galang Rangga Dinata', '25550029', FALSE),
  ('MUCHAMMAD ICHSAN HADI', '25150039', FALSE)
ON CONFLICT (nim) DO UPDATE SET full_name = EXCLUDED.full_name;

-- 10. Update nama admin jika beda dengan Excel
UPDATE members SET full_name = 'Mohamad Bagus Jiran Riskohar' WHERE nim = '24550011';

-- 11. Pastikan RLS policies ada (idempotent)
DO $$
BEGIN
  -- Members
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_all_members') THEN
    CREATE POLICY "service_all_members" ON members FOR ALL USING (true) WITH CHECK (true);
  END IF;
  -- Agendas
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_all_agendas') THEN
    CREATE POLICY "service_all_agendas" ON agendas FOR ALL USING (true) WITH CHECK (true);
  END IF;
  -- Survey questions
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_all_questions') THEN
    CREATE POLICY "service_all_questions" ON survey_questions FOR ALL USING (true) WITH CHECK (true);
  END IF;
  -- Survey responses
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_all_responses') THEN
    CREATE POLICY "service_all_responses" ON survey_responses FOR ALL USING (true) WITH CHECK (true);
  END IF;
  -- Active student votes
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_all_votes') THEN
    CREATE POLICY "service_all_votes" ON active_student_votes FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 12. Verifikasi hasil
SELECT 'MEMBERS' as tabel, count(*) as jumlah FROM members
UNION ALL
SELECT 'AGENDAS', count(*) FROM agendas
UNION ALL
SELECT 'QUESTIONS', count(*) FROM survey_questions
UNION ALL
SELECT 'RESPONSES', count(*) FROM survey_responses
UNION ALL
SELECT 'VOTES', count(*) FROM active_student_votes;

-- 13. Cek admin
SELECT full_name, nim, is_admin FROM members WHERE is_admin = TRUE;

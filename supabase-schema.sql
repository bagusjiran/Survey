-- Supabase SQL Schema for Survey UKM Kerohanian Islam
-- Run this in Supabase SQL Editor

-- Table: members (anggota UKM)
CREATE TABLE IF NOT EXISTS members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  nim TEXT NOT NULL UNIQUE,
  is_admin BOOLEAN DEFAULT FALSE,
  admin_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: agendas (kegiatan/acara)
CREATE TABLE IF NOT EXISTS agendas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES members(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: survey_questions (pertanyaan dinamis dari admin)
CREATE TABLE IF NOT EXISTS survey_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agenda_id UUID REFERENCES agendas(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT DEFAULT 'text' CHECK (question_type IN ('text', 'textarea', 'rating', 'yes_no')),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: survey_responses (jawaban anggota)
CREATE TABLE IF NOT EXISTS survey_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agenda_id UUID REFERENCES agendas(id) ON DELETE CASCADE,
  question_id UUID REFERENCES survey_questions(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id),
  response_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(question_id, member_id)
);

-- Table: active_student_votes (voting mahasiswa teraktif)
CREATE TABLE IF NOT EXISTS active_student_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agenda_id UUID REFERENCES agendas(id) ON DELETE CASCADE,
  voter_id UUID REFERENCES members(id),
  voted_for_id UUID REFERENCES members(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agenda_id, voter_id, voted_for_id)
);

-- Insert admin
INSERT INTO members (full_name, nim, is_admin, admin_code)
VALUES ('Mohamad Bagus Jiran Riskohar', '24550011', TRUE, '134605712')
ON CONFLICT (nim) DO NOTHING;

-- Insert sample members (hapus jika tidak diperlukan)
INSERT INTO members (full_name, nim) VALUES
  ('Ahmad Fauzi', '24550001'),
  ('Muhammad Rizki', '24550002'),
  ('Abdullah Rahman', '24550003'),
  ('Hasan Basri', '24550004'),
  ('Ibrahim Malik', '24550005'),
  ('Yusuf Hamid', '24550006'),
  ('Omar Farouk', '24550007'),
  ('Khalid Wardhani', '24550008'),
  ('Zaid Akbar', '24550009'),
  ('Fadil Hakim', '24550010')
ON CONFLICT (nim) DO NOTHING;

-- RLS Policies
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_student_votes ENABLE ROW LEVEL SECURITY;

-- Allow all operations (since we use custom auth, not Supabase Auth)
CREATE POLICY "Allow all on members" ON members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on agendas" ON agendas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on survey_questions" ON survey_questions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on survey_responses" ON survey_responses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on active_student_votes" ON active_student_votes FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- Survey UKM Kerohanian Islam - Database Schema
-- Universitas Teknologi Ronggolawe
-- =============================================

-- Members table
CREATE TABLE IF NOT EXISTS members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  nim TEXT NOT NULL UNIQUE,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agendas table
CREATE TABLE IF NOT EXISTS agendas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Survey questions (dynamic, created by admin per agenda)
CREATE TABLE IF NOT EXISTS survey_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agenda_id UUID REFERENCES agendas(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT DEFAULT 'text' CHECK (question_type IN ('text', 'textarea', 'radio', 'rating')),
  options JSONB,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Survey responses
CREATE TABLE IF NOT EXISTS survey_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agenda_id UUID REFERENCES agendas(id) ON DELETE CASCADE,
  question_id UUID REFERENCES survey_questions(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  response_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agenda_id, question_id, member_id)
);

-- Active student votes
CREATE TABLE IF NOT EXISTS active_student_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agenda_id UUID REFERENCES agendas(id) ON DELETE CASCADE,
  voter_id UUID REFERENCES members(id) ON DELETE CASCADE,
  voted_for_id UUID REFERENCES members(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed admin account
INSERT INTO members (full_name, nim, is_admin)
VALUES ('Mohamad Bagus Jiran Riskohar', '24550011', TRUE)
ON CONFLICT (nim) DO NOTHING;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_questions_agenda ON survey_questions(agenda_id);
CREATE INDEX IF NOT EXISTS idx_questions_sort ON survey_questions(agenda_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_responses_agenda ON survey_responses(agenda_id);
CREATE INDEX IF NOT EXISTS idx_responses_member ON survey_responses(member_id);
CREATE INDEX IF NOT EXISTS idx_responses_unique ON survey_responses(agenda_id, question_id, member_id);
CREATE INDEX IF NOT EXISTS idx_votes_agenda ON active_student_votes(agenda_id);
CREATE INDEX IF NOT EXISTS idx_votes_voter ON active_student_votes(voter_id, agenda_id);

-- Enable RLS
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_student_votes ENABLE ROW LEVEL SECURITY;

-- Permissive policies (we use service role key on server)
CREATE POLICY "service_all_members" ON members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_all_agendas" ON agendas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_all_questions" ON survey_questions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_all_responses" ON survey_responses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_all_votes" ON active_student_votes FOR ALL USING (true) WITH CHECK (true);

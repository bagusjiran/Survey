-- Fix: UNIQUE constraint untuk mencegah double vote (race condition)
-- Jalankan script ini di Supabase SQL Editor

-- 1. Tambah UNIQUE constraint pada votes (jika belum ada)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'active_student_votes_unique'
  ) THEN
    ALTER TABLE active_student_votes 
    ADD CONSTRAINT active_student_votes_unique 
    UNIQUE (agenda_id, voter_id, voted_for_id);
    RAISE NOTICE 'Constraint active_student_votes_unique berhasil ditambahkan';
  ELSE
    RAISE NOTICE 'Constraint active_student_votes_unique sudah ada, skip';
  END IF;
END $$;

-- 2. Verifikasi
SELECT 
  conname as constraint_name,
  conrelid::regclass as table_name,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'active_student_votes'::regclass
  AND contype = 'u';

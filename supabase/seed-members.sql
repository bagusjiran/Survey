-- =============================================
-- Survey UKM Kerohanian Islam - Data Anggota
-- Generated from ANGGOTA ROHIS.xlsx
-- =============================================

-- Hapus semua anggota KECUALI admin (NIM 24550011)
DELETE FROM members WHERE nim != '24550011';

-- Insert semua anggota (ON CONFLICT = update nama jika sudah ada)
INSERT INTO members (full_name, nim, is_admin) VALUES
  ('Mohamad Bagus Jiran Riskohar', '24550011', TRUE),
  ('Olivia Cahyani Agustina', '24550023', FALSE),
  ('Zifa Aulia Marfu`atun', '24150062', FALSE),
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
ON CONFLICT (nim) DO UPDATE SET
  full_name = EXCLUDED.full_name;

-- Total: 23 anggota (1 admin + 22 anggota)

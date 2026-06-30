# Analisis Log Supabase — Survey UKM Kerohanian Islam

## Ringkasan Error

### 🔴 Error Aplikasi (PERLU DIFIX)

| Log | Timestamp | Error | Penyebab | Fix |
|-----|-----------|-------|----------|-----|
| #4 | 05:13:10 | `POST 400 /rest/v1/agendas` | Kolom `event_date` tidak ada di tabel | Jalankan `fix-migration.sql` |
| #5 | 05:13:04 | `POST 400 /rest/v1/agendas` | Sama seperti atas | Jalankan `fix-migration.sql` |
| #9 | 04:59:29 | `GET 406 /rest/v1/members` | NIM salah: `Admin123!` (bukan `24550011`) | User salah input |
| #10 | 04:59:16 | `GET 406 /rest/v1/members` | Sama seperti atas | User salah input |

### ⚪ Error Supabase Internal (BISA DIABAIKAN)

| Error | Jumlah | Keterangan |
|-------|--------|------------|
| `database "supabase_admin" does not exist` | 10x | Supabase internal, tidak berpengaruh |
| `relation "supabase_migrations.schema_migrations" does not exist` | 6x | Supabase internal, tidak berpengaruh |
| `relation "realtime.subscription" does not exist` | 7x | Realtime tidak diaktifkan, tidak berpengaruh |

---

## Detail Error

### Error #4 & #5: POST 400 pada agendas
**Pesan:** `Could not find the 'event_date' column of 'agendas' in the schema cache`
**Penyebab:** Schema lama (`supabase-schema.sql`) tidak punya kolom `event_date`
**Fix:** Jalankan `supabase/fix-migration.sql` di Supabase SQL Editor

### Error #9 & #10: GET 406 pada members
**URL:** `members?full_name=ilike.Mohamad+Bagus+Jiran+Riskohar&nim=eq.Admin123%21`
**Penyebab:** NIM yang dimasukkan adalah `Admin123!` bukan `24550011`
**Kemungkinan:** User memasukkan kode admin di field NIM
**Fix:** Pastikan NIM = `24550011`, kode admin = `***` (di field terpisah)

---

## Langkah Fix

1. Buka Supabase Dashboard → SQL Editor
2. Copy-paste isi `supabase/fix-migration.sql`
3. Klik Run
4. Login dengan:
   - Nama: pilih dari dropdown
   - NIM: `24550011`
   - Kode Admin: `***` (jika login admin)

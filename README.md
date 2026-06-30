# 🕌 Survey UKM Kerohanian Islam

Sistem Survey Mahasiswa Teraktif - UKM Kerohanian Islam UTR Cepu

## Fitur

### Admin
- ✅ Kelola anggota (tambah/hapus)
- ✅ Buat & kelola agenda kegiatan
- ✅ Tambah pertanyaan survey (teks, paragraf, pilihan ganda, rating)
- ✅ Vote 2 mahasiswa teraktif
- ✅ Lihat hasil vote dengan progress bar
- ✅ Dashboard statistik

### Anggota
- ✅ Lihat agenda aktif
- ✅ Isi survey per agenda
- ✅ Pilih 1 mahasiswa teraktif (dropdown, nama sendiri tidak muncul)
- ✅ Notifikasi sudah mengisi

### Keamanan
- ✅ Login: Nama + NIM
- ✅ Admin: tambahan kode proteksi
- ✅ JWT session (httpOnly cookie)
- ✅ Middleware proteksi route

---

## 🚀 Setup & Deploy

### 1. Setup Supabase

1. Buka [supabase.com](https://supabase.com) dan buat project baru
2. Buka **SQL Editor** di dashboard Supabase
3. Copy-paste isi file `supabase/schema.sql` dan jalankan
4. Buka **Settings > API** dan catat:
   - **Project URL** (contoh: `https://xxxx.supabase.co`)
   - **Service Role Key** (di bagian `service_role`, bukan `anon`)

### 2. Setup Environment Variables

Edit file `.env.local` di root project:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx
SESSION_SECRET=random-string-minimal-32-characters-here
ADMIN_SECRET_CODE=134605712
```

### 3. Jalankan Lokal

```bash
npm install
npm run dev
```

Buka http://localhost:3000

### 4. Deploy ke Vercel

#### Option A: Via Vercel CLI
```bash
npm i -g vercel
vercel login
vercel
```

#### Option B: Via GitHub
1. Push project ke GitHub
2. Buka [vercel.com](https://vercel.com) > New Project
3. Import repository
4. Tambahkan Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SESSION_SECRET`
   - `ADMIN_SECRET_CODE`
5. Klik Deploy

---

## 📋 Cara Penggunaan

### Login Admin
1. Buka halaman login
2. Masukkan:
   - Nama: **Mohamad Bagus Jiran Riskohar**
   - NIM: **24550011**
3. Aktifkan toggle **Login sebagai Admin**
4. Masukkan kode: **134605712**
5. Klik **Masuk**

### Login Anggota
1. Buka halaman login
2. Masukkan nama dan NIM sesuai data yang didaftarkan admin
3. Klik **Masuk**

### Alur Kerja
1. **Admin** tambah anggota via menu Kelola Anggota
2. **Admin** buat agenda via menu Kelola Agenda
3. **Admin** tambah pertanyaan ke agenda
4. **Anggota** buka agenda dan isi survey + vote
5. **Admin** lihat hasil vote di detail agenda

---

## 📁 Struktur Project

```
survey-ukm/
├── app/
│   ├── page.tsx              # Login page
│   ├── layout.tsx            # Root layout
│   ├── globals.css           # Global styles + animations
│   ├── admin/
│   │   ├── layout.tsx        # Admin layout + sidebar
│   │   ├── page.tsx          # Dashboard
│   │   ├── anggota/page.tsx  # Kelola anggota
│   │   └── agenda/
│   │       ├── page.tsx      # Kelola agenda
│   │       └── [id]/page.tsx # Detail agenda + pertanyaan + vote
│   ├── survey/
│   │   ├── page.tsx          # Daftar agenda (anggota)
│   │   └── [id]/page.tsx     # Form survey + vote
│   └── api/                  # API routes
├── lib/
│   ├── supabase.ts           # Supabase client
│   └── auth.ts               # JWT session helpers
├── components/
│   └── Sidebar.tsx           # Admin sidebar
├── supabase/
│   └── schema.sql            # Database schema
├── middleware.ts              # Route protection
└── .env.local                # Environment variables
```

## 🛠 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Auth**: JWT (jose) + httpOnly cookies
- **Styling**: Tailwind CSS + custom animations
- **Deploy**: Vercel

# Sistem Absensi Bimbel

Platform absensi bimbel berbasis web dan seluler untuk mengelola angkatan, siswa, kelas, sesi, absensi QR, evaluasi, laporan, dan notifikasi dalam satu alur kerja operasional.

## Push ke GitHub (Jika Ada Pembaruan)

Jika Anda telah melakukan perubahan pada kode dan ingin menyimpannya ke GitHub:

```bash
# 1. Pastikan semua perubahan disimpan
git add .

# 2. Commit perubahan dengan pesan yang jelas
git commit -m "deskripsi perubahan yang dilakukan"

# 3. Push ke GitHub
git push origin main
```

**Catatan Penting:**
- File `.env` **tidak akan ter-upload** karena sudah ada di `.gitignore` (berisi secret)
- File database `server/data/bimbel-absensi.db` **tidak akan ter-upload** karena sudah di `.gitignore`
- Hanya kode sumber yang akan ter-upload ke GitHub

### Jika Belum Pernah Push ke GitHub:

```bash
# Inisialisasi git (jika belum)
git init

# Tambah remote repository (ganti URL dengan repo Anda)
git remote add origin https://github.com/username-anda/repo-name.git

# Push pertama kali
git add .
git commit -m "Initial commit"
git push -u origin main
```

## Isi panduan

- [Gambaran fitur](#gambaran-fitur)
- [Struktur proyek](#struktur-proyek)
- [Persiapan awal](#persiapan-awal)
- [Konfigurasi database](#konfigurasi-database)
- [Cara menyalakan aplikasi](#cara-menyalakan-aplikasi)
- [Cara mematikan aplikasi](#cara-mematikan-aplikasi)
- [Akun masuk demo](#akun-masuk-demo)
- [Alur kerja harian](#alur-kerja-harian)
- [Catatan keamanan](#catatan-keamanan)
- [Troubleshooting](#troubleshooting)

## Gambaran fitur

- Login aman dengan `JWT`
- Mode autentikasi ganda:
  - Web memakai cookie `httpOnly`
  - Aplikasi seluler memakai token otorisasi
- Pengelolaan pengguna berdasarkan peran `SUPER_ADMIN`, `ADMIN`, `STAFF`, dan `INSTRUCTOR`
- Pengelolaan angkatan, siswa, kelas, sesi, absensi, dan evaluasi
- QR absensi per sesi
- Laporan absensi PDF dan Excel
- Notifikasi WhatsApp ke orang tua
- Tampilan web responsif
- Aplikasi seluler berbasis Expo
- Validasi input ketat dengan `zod`
- Pengamanan server dengan `helmet`, `cors`, `rate limiting`, dan pembatasan origin

## Struktur proyek

```
New project/
├── client/                 # Aplikasi web React + Vite
│   ├── src/
│   │   ├── components/     # Komponen React modular
│   │   ├── App.jsx         # Komponen utama
│   │   └── api.js          # Klien API
│   └── package.json
├── server/                 # API Express + Prisma
│   ├── src/
│   │   ├── routes/         # Route handlers terpisah
│   │   ├── utils/          # Utility functions (asyncHandler)
│   │   ├── app.js          # Konfigurasi Express
│   │   └── config.js       # Konfigurasi environment
│   ├── prisma/
│   │   ├── schema.prisma   # Schema database
│   │   └── seed.js         # Data seed untuk demo
│   └── package.json
├── mobile-app/             # Aplikasi seluler React Native + Expo
│   ├── App.js
│   └── package.json
├── .env.example            # Template environment variables
└── README.md
```

## Persiapan awal

1. **Salin file environment:**

```bash
cp .env.example .env
```

2. **Konfigurasi environment variables di `.env`:**

```bash
# Wajib diisi
JWT_SECRET=generate-random-string-min-32-chars
QR_SECRET=generate-another-random-string
DATABASE_URL="file:./data/bimbel-absensi.db"  # Untuk development

# Opsional
PORT=4000
CLIENT_URL=http://127.0.0.1:5173
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
COOKIE_SECURE=false  # Set true jika pakai HTTPS
```

3. **Install dependensi:**

```bash
# Install semua dependensi
npm install

# Atau per workspace
cd server && npm install
cd ../client && npm install
cd ../mobile-app && npm install
```

4. **Setup database:**

```bash
# Generate Prisma Client
cd server
npx prisma generate

# Buat database
npx prisma db push

# (Opsional) Isi data demo
node prisma/seed.js
```

## Konfigurasi Database

### Development (SQLite)

Gunakan SQLite untuk development lokal:

```bash
# .env
DATABASE_URL="file:./data/bimbel-absensi.db"
```

```bash
# schema.prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

### Production (PostgreSQL)

Untuk production, gunakan PostgreSQL:

1. **Buat akun di penyedia database:**
   - [Supabase](https://supabase.com) (gratis 500MB)
   - [Neon](https://neon.tech) (gratis 500MB)
   - [Railway](https://railway.app) (gratis $5 credit)

2. **Dapatkan connection string** dari dashboard penyedia

3. **Update `.env`:**

```bash
DATABASE_URL="postgresql://user:password@host:5432/dbname"
```

4. **Update `schema.prisma`:**

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

5. **Sync database:**

```bash
cd server
npx prisma db push
```

## Cara Menyalakan Aplikasi

### Setup Awal (Sekali Saja)

Jalankan semua setup dalam satu perintah:

```bash
npm run setup
```

Perintah ini akan:
1. Install semua dependensi
2. Generate Prisma Client
3. Buat database
4. Isi data demo (akun admin, dll.)

### Jalankan dengan Satu Perintah

**Server + Web (Development):**
```bash
npm run dev
```

**Server + Web + Mobile (Semua Service):**
```bash
npm run dev:all
```

### Jalankan Service Terpisah (Opsional)

**Terminal 1 - Server API:**
```bash
npm run dev:server
```
Server berjalan di `http://127.0.0.1:4000`

**Terminal 2 - Web Client:**
```bash
npm run dev:client
```
Web berjalan di `http://127.0.0.1:5173`

**Terminal 3 - Mobile App:**
```bash
npm run dev:mobile
```

### Build untuk Production

```bash
# Build frontend
npm run build --workspace client

# Build backend (jika perlu)
cd server
npm run build
```

## Cara Mematikan Aplikasi

### Jika Menjalankan dengan `npm run dev` (Semua Service Bersamaan)

Tekan **`Ctrl + C`** di terminal yang menjalankan `npm run dev`, lalu ketik `Y` untuk konfirmasi.

```bash
# Tekan Ctrl + C
^C
# Ketik Y lalu Enter untuk konfirmasi
Y
```

### Jika Menjalankan Service Terpisah

- **Server API:** Tekan `Ctrl + C` di terminal server
- **Web Client:** Tekan `Ctrl + C` di terminal web
- **Mobile App:** Tekan `Ctrl + C` di terminal Expo

### Mematikan Paksa (Jika Macet)

Jika `Ctrl + C` tidak merespons:

```bash
# Cari proses Node.js
ps aux | grep node

# Hentikan proses (ganti PID dengan ID proses)
kill -9 <PID>

# Atau hentikan semua proses Node
killall node
```

## Akun Masuk Demo

Setelah menjalankan `npm run prisma:seed` atau `node server/prisma/seed.js`, akun berikut tersedia:

| Peran | Email | Kata sandi |
| --- | --- | --- |
| Super Admin | `superadmin@bimbel.local` | `DemoAkun123!` |
| Admin | `admin@bimbel.local` | `DemoAkun123!` |
| Staf | `staff@bimbel.local` | `DemoAkun123!` |
| Pengajar | `pengajar@bimbel.local` | `DemoAkun123!` |

**Catatan:**
- Akun demo hanya untuk pengujian lokal
- Ubah kata sandi dan secret sebelum production

## Alur Kerja Harian

1. **Nyalakan server:**
   ```bash
   cd server && npm run dev
   ```

2. **Nyalakan web:**
   ```bash
   cd client && npm run dev
   ```

3. **Buka browser:** `http://127.0.0.1:5173`

4. **Login** dengan akun operasional

5. **Kelola data:**
   - Tambah angkatan → Tambah siswa → Tambah kelas → Tambah sesi

6. **Absensi:**
   - Buat QR untuk sesi aktif
   - Scan QR atau input manual

7. **Evaluasi:**
   - Isi evaluasi per siswa per sesi

8. **Laporan:**
   - Unduh PDF/Excel dari menu Laporan

9. **Notifikasi:**
   - Kirim WhatsApp ke orang tua (jika dikonfigurasi)

## Catatan Keamanan

### Wajib dilakukan sebelum production:

1. **Ganti semua secret default:**
   ```bash
   JWT_SECRET=<random-64-char-string>
   QR_SECRET=<random-64-char-string>
   ```

2. **Generate random secret:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. **Konfigurasi CORS:**
   ```bash
   ALLOWED_ORIGINS=https://domain-anda.com
   ```

4. **Aktifkan COOKIE_SECURE:**
   ```bash
   COOKIE_SECURE=true  # Wajib jika pakai HTTPS
   ```

5. **Jangan commit `.env`:**
   - File `.env` sudah ada di `.gitignore`
   - Jangan pernah upload secret ke GitHub

6. **Gunakan database production:**
   - Jangan pakai SQLite untuk production
   - Gunakan PostgreSQL/MySQL

7. **Fail-Fast validation:**
   - Server akan menolak jalan jika `JWT_SECRET` atau `QR_SECRET` tidak diatur

## Troubleshooting

### Error: P1001 - Can't reach database server

**Penyebab:** Tidak bisa koneksi ke database PostgreSQL

**Solusi:**
1. Cek IP whitelist di Supabase Dashboard → Settings → Network
2. Pastikan password benar
3. Gunakan SQLite untuk development:
   ```bash
   DATABASE_URL="file:./data/bimbel-absensi.db"
   ```

### Error: Could not find Prisma Schema

**Penyebab:** Menjalankan prisma dari folder yang salah

**Solusi:**
```bash
cd server
npx prisma db push
```

### Error: JWT_SECRET or QR_SECRET not set

**Penyebab:** Environment variables wajib tidak diatur

**Solusi:**
1. Pastikan `.env` ada di root project
2. Isi `JWT_SECRET` dan `QR_SECRET` dengan string random

### Web tidak bisa connect ke API

**Penyebab:** CORS atau API belum jalan

**Solusi:**
1. Pastikan server API sudah jalan di port 4000
2. Cek `ALLOWED_ORIGINS` di `.env`
3. Restart kedua service

### Mobile app tidak bisa connect

**Penyebab:** API URL salah atau backend di mesin berbeda

**Solusi:**
```bash
# Set API URL yang benar
EXPO_PUBLIC_API_URL=http://IP-SERVER:4000/api npm start
```

---

**Dibuat dengan:** Express.js, React, Prisma, SQLite/PostgreSQL, Expo

## Quick Start (Cepat)

# 1. Setup (sekali saja)
cp .env.example .env
npm run setup

# 2. Jalankan semua service
npm run dev

# 3. Buka browser: http://127.0.0.1:5173
# Login: superadmin@bimbel.local / DemoAkun123!

**Dibuat dengan:** Express.js, React, Prisma, SQLite/PostgreSQL, Expo

**Sistem Absensi Bimbel - Production Ready!**

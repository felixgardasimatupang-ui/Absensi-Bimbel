# Sistem Absensi Bimbel

Platform absensi bimbel berbasis web dan seluler untuk mengelola angkatan, siswa, kelas, sesi, absensi QR, evaluasi, laporan, dan notifikasi dalam satu alur kerja operasional.

## Isi panduan

- gambaran fitur
- struktur proyek
- persiapan awal
- cara menyalakan web, server, dan aplikasi seluler
- cara mematikan layanan
- alur kerja harian
- catatan keamanan

## Gambaran fitur

- login aman dengan `JWT`
- mode autentikasi ganda:
  web memakai cookie `httpOnly`
  aplikasi seluler memakai token otorisasi
- pengelolaan pengguna berdasarkan peran `SUPER_ADMIN`, `ADMIN`, `STAFF`, dan `INSTRUCTOR`
- pengelolaan angkatan, siswa, kelas, sesi, absensi, dan evaluasi
- QR absensi per sesi
- laporan absensi PDF dan Excel
- notifikasi WhatsApp ke orang tua
- tampilan web responsif
- aplikasi seluler berbasis Expo
- validasi input ketat dengan `zod`
- pengamanan server dengan `helmet`, `cors`, `rate limiting`, dan pembatasan origin

## Struktur proyek

- `client` berisi aplikasi web React + Vite
- `server` berisi API Express + Prisma
- `mobile-app` berisi aplikasi seluler React Native + Expo

## Persiapan awal

1. Salin file contoh environment:

```bash
cp .env.example .env
```

2. Ubah nilai penting di `.env`:

- `JWT_SECRET`
- `QR_SECRET`
- `ALLOWED_ORIGINS`
- `CLIENT_URL`
- `APP_URL`

3. Pasang dependensi:

```bash
npm install
```

4. Siapkan basis data dan Prisma:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

## Menyalakan aplikasi

Jalankan server API:

```bash
npm run dev:server
```

Jalankan aplikasi web:

```bash
npm run dev:client
```

Jalankan aplikasi seluler:

```bash
cd mobile-app
npm install
npm start
```

Jika backend berjalan di mesin lain, set alamat API aplikasi seluler:

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.10:4000/api npm start
```

Build frontend untuk produksi:

```bash
npm run build --workspace client
```

## Akun masuk demo

Setelah menjalankan `npm run prisma:seed`, akun berikut tersedia untuk login:

| Peran | Email | Kata sandi |
| --- | --- | --- |
| Super Admin | `superadmin@bimbel.local` | `DemoAkun123!` |
| Admin | `admin@bimbel.local` | `DemoAkun123!` |
| Staf | `staff@bimbel.local` | `DemoAkun123!` |
| Pengajar | `pengajar@bimbel.local` | `DemoAkun123!` |

Catatan:

- akun di atas dibuat untuk kebutuhan demo dan pengujian lokal
- ubah kata sandi dan secret sebelum dipakai di lingkungan nyata

## Mematikan aplikasi

- tekan `Ctrl + C` pada terminal server
- tekan `Ctrl + C` pada terminal web
- tekan `Ctrl + C` pada terminal Expo untuk aplikasi seluler

## Alur kerja harian

1. Nyalakan server dengan `npm run dev:server`.
2. Nyalakan web dengan `npm run dev:client`.
3. Login memakai akun operasional yang sudah dibuat.
4. Kelola angkatan, siswa, kelas, dan sesi.
5. Buat QR absensi untuk sesi aktif.
6. Catat absensi dan evaluasi.
7. Kirim notifikasi bila diperlukan.
8. Unduh laporan saat dibutuhkan.

## Catatan keamanan

- jangan gunakan secret bawaan dari `.env.example` di lingkungan nyata
- isi `JWT_SECRET` dengan string acak minimal 32 karakter
- isi `QR_SECRET` dengan secret yang berbeda dari `JWT_SECRET`
- batasi origin frontend melalui `ALLOWED_ORIGINS`
- aktifkan bootstrap awal hanya saat setup pertama dengan `ALLOW_BOOTSTRAP=true`
- gunakan `BOOTSTRAP_KEY` bila ingin melindungi endpoint bootstrap
- aktifkan `COOKIE_SECURE=true` saat aplikasi berjalan di HTTPS
- simpan semua rahasia di environment variable dan jangan di-commit
- isi `WHATSAPP_API_URL` dan `WHATSAPP_API_TOKEN` hanya jika integrasi notifikasi dipakai

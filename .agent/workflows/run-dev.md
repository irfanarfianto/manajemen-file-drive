---
description: Menjalankan dan memeriksa aplikasi di lingkungan development
---

# Workflow: Menjalankan Development Server

Gunakan workflow ini untuk menjalankan, memeriksa, dan debug aplikasi selama development.

---

## Menjalankan Dev Server

### 1. Pastikan dependencies sudah terinstall
```bash
npm install
```

### 2. Pastikan `.env.local` sudah ada dan terisi
```bash
# Cek apakah file .env.local ada
ls .env.local
```

Jika belum ada, salin dari template:
```bash
cp .env.example .env.local
```

### 3. Jalankan dev server
// turbo
```bash
npm run dev
```

Server akan berjalan di: **http://localhost:3000**

---

## Memeriksa Kesehatan Aplikasi

### Checklist saat dev server berjalan:
- [ ] Tidak ada error merah di terminal
- [ ] Halaman login/dashboard tampil dengan benar
- [ ] Google OAuth redirect bekerja (redirect ke Google dan kembali)
- [ ] File list tampil setelah login
- [ ] Tidak ada error di Browser DevTools Console

---

## Build Production (hanya jika diperlukan)

### 1. Build production bundle
```bash
npm run build
```

### 2. Jalankan production server secara lokal
```bash
npm start
```

### 3. Cek output build
Perhatikan:
- Tidak ada `Error` di output build
- Ukuran bundle tidak terlalu besar (peringatkan jika > 500KB)
- Semua halaman berhasil di-generate

---

## Debugging Umum

| Problem | Solusi |
|---|---|
| "Error: Cannot find module" | Jalankan `npm install` |
| "Invalid client" saat OAuth | Cek `GOOGLE_CLIENT_ID` di `.env.local` |
| "Unauthorized" dari API | Pastikan session masih valid, coba login ulang |
| Halaman tidak update | Hard refresh browser (Ctrl+Shift+R) |
| Port 3000 sudah dipakai | Jalankan `npm run dev -- -p 3001` |

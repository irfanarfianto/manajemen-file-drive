---
description: Setup project Next.js baru dengan konfigurasi Google Drive API
---

# Workflow: Setup Project Baru

Jalankan workflow ini hanya sekali saat awal project. Pastikan Node.js ≥ 18 sudah terinstall.

## Prasyarat
- Node.js ≥ 18 terinstall
- Google Cloud Project sudah dibuat
- Google Drive API sudah diaktifkan
- OAuth 2.0 credentials sudah dibuat

---

## Langkah-langkah

### 1. Inisialisasi Project Next.js
```bash
npx create-next-app@latest . --typescript --tailwind=false --eslint --app --src-dir --import-alias "@/*" --no-git
```

### 2. Install dependencies yang diperlukan
```bash
npm install next-auth @auth/core googleapis lucide-react
npm install -D @types/node
```

### 3. Buat file `.env.local` dari template
Salin `.env.example` ke `.env.local` dan isi dengan credentials asli:
```bash
cp .env.example .env.local
```

Isi `.env.local` dengan:
```env
GOOGLE_CLIENT_ID=<dari Google Cloud Console>
GOOGLE_CLIENT_SECRET=<dari Google Cloud Console>
NEXTAUTH_SECRET=<generate dengan: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000
```

### 4. Buat `.gitignore` (pastikan `.env.local` ada di dalamnya)
Verifikasi bahwa `.gitignore` sudah mengandung:
```
.env.local
.env*.local
```

### 5. Buat struktur folder
```bash
mkdir -p src/components/ui
mkdir -p src/components/drive
mkdir -p src/lib/google
mkdir -p src/lib/utils
mkdir -p src/context
mkdir -p src/hooks
mkdir -p src/types
mkdir -p src/styles
```

### 6. Jalankan dev server untuk verifikasi
```bash
npm run dev
```

Buka http://localhost:3000 — seharusnya tampil halaman Next.js default.

---

## Verifikasi Setup Berhasil
- [ ] Dev server berjalan di http://localhost:3000
- [ ] File `.env.local` sudah ada dan terisi
- [ ] File `.env.local` ada di `.gitignore`
- [ ] Semua folder struktur sudah dibuat

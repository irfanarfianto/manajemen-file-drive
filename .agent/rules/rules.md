# Rules & Standar Pengembangan — Manajemen File Drive

## 🎯 Gambaran Umum Project
Dashboard berbasis web untuk membuat dan mengelola file yang terintegrasi langsung dengan Google Drive API. Dibangun menggunakan Next.js, didesain dengan tampilan modern dan premium.

---

## 🏗️ Tech Stack

| Layer | Teknologi |
|---|---|
| Framework | Next.js 14+ (App Router) |
| Bahasa | TypeScript |
| Styling | Vanilla CSS (CSS Modules) |
| Auth & API | Google OAuth 2.0 + Google Drive API v3 |
| State Management | React Context + useReducer |
| HTTP Client | Native Fetch API |
| Icons | Lucide React |

---

## 📁 Struktur Folder

```
manajemen-file-drive/
├── .agent/
│   ├── rules.md              ← File ini
│   └── workflows/            ← Semua workflow ada di sini
├── src/
│   ├── app/                  ← Next.js App Router pages
│   │   ├── layout.tsx
│   │   ├── page.tsx          ← Halaman utama / login
│   │   ├── dashboard/
│   │   │   └── page.tsx      ← Dashboard utama
│   │   └── api/
│   │       └── drive/        ← API routes untuk Drive
│   ├── components/           ← Reusable UI components
│   │   ├── ui/               ← Komponen dasar (Button, Modal, dll)
│   │   └── drive/            ← Komponen khusus Drive
│   ├── lib/
│   │   ├── google/           ← Google API helpers
│   │   └── utils/            ← Utilitas umum
│   ├── context/              ← React Context providers
│   ├── hooks/                ← Custom React hooks
│   ├── types/                ← TypeScript type definitions
│   └── styles/               ← Global CSS & design tokens
├── public/
├── .env.local                ← Environment variables (JANGAN di-commit)
├── .env.example              ← Template env variables
└── next.config.ts
```

---

## 📐 Standar Kode

### TypeScript
- **Selalu** gunakan TypeScript, hindari penggunaan `any`
- Definisikan semua tipe di folder `src/types/`
- Gunakan `interface` untuk tipe objek, `type` untuk union/intersection
- Export tipe dengan eksplisit

```typescript
// ✅ BENAR
interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  modifiedTime: string;
  parents?: string[];
}

// ❌ SALAH
const file: any = { ... }
```

### Penamaan
- **Komponen**: PascalCase → `FileCard`, `DriveToolbar`
- **Fungsi/variabel**: camelCase → `fetchFiles`, `currentFolder`
- **Konstanta global**: UPPER_SNAKE_CASE → `GOOGLE_DRIVE_API_URL`
- **File komponen**: PascalCase → `FileCard.tsx`
- **File utilitas/hook**: camelCase → `useDriveFiles.ts`, `formatFileSize.ts`
- **CSS Module classes**: camelCase → `.fileCard`, `.toolbarButton`

### Komponen React
- Gunakan **functional components** dengan hooks
- Satu komponen per file
- Props harus memiliki tipe yang didefinisikan dengan `interface Props`
- Pisahkan logika bisnis ke dalam custom hooks

```typescript
// ✅ Pola yang benar
interface Props {
  file: DriveFile;
  onDelete: (id: string) => void;
}

export function FileCard({ file, onDelete }: Props) {
  // ...
}
```

---

## 🔐 Keamanan & Environment Variables

### Wajib
- **JANGAN PERNAH** hardcode API key, client secret, atau token
- Semua credentials harus ada di `.env.local`
- `.env.local` harus selalu ada di `.gitignore`
- Buat `.env.example` sebagai template (tanpa nilai asli)

### Variabel yang Diperlukan
```env
# .env.example
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

### API Routes
- Semua interaksi dengan Google Drive API dilakukan di **server-side** (API routes)
- Jangan ekspos access token ke client-side
- Validasi session di setiap API route

---

## 🎨 Standar Desain

### Design System
- Semua warna, spacing, font didefinisikan sebagai **CSS custom properties** di `src/styles/globals.css`
- Jangan gunakan nilai hardcode di komponen (misal: `color: #fff`)

```css
/* ✅ Gunakan design tokens */
.button {
  background: var(--color-primary);
  padding: var(--spacing-md);
}

/* ❌ Jangan hardcode */
.button {
  background: #6366f1;
  padding: 12px 24px;
}
```

### Prinsip UI
- **Dark mode** sebagai default, dukung light mode
- Gunakan **glassmorphism** untuk card dan panel
- Animasi **smooth & halus** (transition ≤ 300ms)
- Selalu implementasikan **loading state** dan **empty state**
- Tampilan harus **responsive** (mobile, tablet, desktop)
- Gunakan Google Font **Inter** sebagai font utama

---

## 🔄 Penanganan Error & Loading

### Setiap operasi async HARUS memiliki:
1. **Loading state** — tampilkan spinner/skeleton
2. **Error state** — tampilkan pesan error yang informatif
3. **Success feedback** — notifikasi/toast saat operasi berhasil
4. **Empty state** — tampilkan ilustrasi saat data kosong

```typescript
// ✅ Pola yang benar untuk fetch data
async function fetchFiles() {
  setLoading(true);
  setError(null);
  try {
    const data = await getDriveFiles(folderId);
    setFiles(data);
  } catch (err) {
    setError('Gagal memuat file. Silakan coba lagi.');
    console.error('[fetchFiles]', err);
  } finally {
    setLoading(false);
  }
}
```

---

## 🌐 API Integration Rules

### Google Drive API
- Gunakan **Drive API v3** (bukan v2)
- Selalu request scope seminimal mungkin (principle of least privilege)
- Handle token refresh otomatis
- Implementasikan **pagination** untuk listing file (pageSize maks 100)
- Cache response yang memungkinkan untuk mengurangi API calls

### Scope yang Digunakan
```
https://www.googleapis.com/auth/drive          ← Full access (upload, delete)
https://www.googleapis.com/auth/userinfo.email ← Info user
```

---

## ✅ Checklist Sebelum Commit

- [ ] Tidak ada `console.log` yang tertinggal (gunakan `console.error` untuk error)
- [ ] Tidak ada nilai hardcode untuk credentials
- [ ] Semua komponen baru memiliki TypeScript types
- [ ] Loading & error state sudah diimplementasikan
- [ ] Tampilan sudah dicek di mobile view
- [ ] Tidak ada import yang tidak digunakan

---

## 🚫 Hal yang TIDAK Boleh Dilakukan

1. ❌ Commit file `.env.local`
2. ❌ Menggunakan `any` untuk tipe TypeScript
3. ❌ Membuat logika API di dalam komponen langsung (harus di custom hook atau API route)
4. ❌ Hardcode warna/spacing (gunakan CSS variables)
5. ❌ Membuat komponen yang melebihi 300 baris (pisah jadi sub-komponen)
6. ❌ Mengekspos Google credentials ke client-side

---
description: Cara membuat dan menambahkan komponen UI baru ke project
---

# Workflow: Menambahkan Komponen Baru

Ikuti langkah ini setiap kali membuat komponen baru agar konsisten dengan standar project.

---

## Langkah-langkah

### 1. Tentukan kategori komponen
- **`src/components/ui/`** → Komponen generik yang bisa dipakai di mana saja (Button, Modal, Tooltip, Badge, Toast, dll)
- **`src/components/drive/`** → Komponen spesifik fitur Drive (FileCard, FolderTree, UploadZone, dll)

### 2. Buat file komponen dengan struktur standar

Template untuk komponen baru:
```typescript
// src/components/[kategori]/NamaKomponen.tsx

interface Props {
  // Definisikan semua props dengan tipe yang jelas
  // Contoh:
  label: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  isLoading?: boolean;
  disabled?: boolean;
}

export function NamaKomponen({ label, onClick, variant = 'primary', isLoading, disabled }: Props) {
  // Logika komponen di sini
  
  return (
    <div className={styles.container}>
      {/* JSX */}
    </div>
  );
}
```

### 3. Buat CSS Module untuk komponen
Buat file `NamaKomponen.module.css` di folder yang sama:
```css
/* Gunakan CSS variables dari globals.css */
.container {
  /* ... */
}
```

### 4. Export dari index barrel
Tambahkan export ke `src/components/[kategori]/index.ts`:
```typescript
export { NamaKomponen } from './NamaKomponen';
```

### 5. Implementasikan semua state yang diperlukan
Pastikan komponen menangani:
- [ ] **Loading state** jika ada operasi async
- [ ] **Error state** jika bisa gagal
- [ ] **Empty state** jika data bisa kosong
- [ ] **Disabled state** jika ada interaksi

### 6. Verifikasi di browser
Jalankan dev server dan pastikan:
- [ ] Komponen tampil dengan benar
- [ ] Tidak ada error di console
- [ ] Tampilan responsive (cek di mobile view browser)
- [ ] Animasi/transisi berjalan smooth

---

## Contoh Struktur yang Baik

```
src/components/drive/
├── FileCard/
│   ├── FileCard.tsx
│   ├── FileCard.module.css
│   └── index.ts        ← re-export
├── FolderTree/
│   ├── FolderTree.tsx
│   └── FolderTree.module.css
└── index.ts            ← export semua komponen drive
```

---
description: Prosedur untuk merefaktorisasi kode yang tidak scalable, tidak modular, dan sulit di-maintain.
---

### 1. Audit & Identifikasi (The "Why")
Sebelum mengubah kode, identifikasi masalah utama (Code Smells):
- **God Components**: Komponen dengan >300 baris kode yang menangani terlalu banyak hal.
- **Tight Coupling**: Logic bisnis yang keras (hardcoded) di dalam event handler UI.
- **Prop Drilling**: Operasi passing props melalui >3 level komponen yang tidak membutuhkannya.
- **Duplikasi Logic**: Kode yang sama muncul di beberapa file berbeda tanpa abstraksi.

### 2. Dekopling Logic ke Custom Hooks
Pisahkan state management dan API calls dari JSX:
1. Buat file baru di `src/hooks/` (misal: `useFileManagement.ts`).
2. Pindahkan `useState`, `useEffect`, dan fungsi-fungsi API handler ke hook tersebut.
3. Return hanya state dan function yang dibutuhkan oleh UI.
4. *Benefit*: Logic menjadi testable secara independen dan UI menjadi lebih bersih.

### 3. Modularisasi Komponen (Atomic Design)
Pecah komponen raksasa menjadi potongan-potongan kecil:
1. Identifikasi bagian UI yang bisa berdiri sendiri (misal: `FileList`, `FolderBreadcrumbs`, `ModalFooter`).
2. Buat folder komponen khusus (misal: `src/components/drive/subcomponents/`).
3. Pastikan komponen anak hanya menerima data via props yang relevan (Prinsip Least Privilege).

### 4. Implementasi Scalable Patterns
Gunakan pola desain yang tepat:
- **Provider Pattern**: Jika data dibutuhkan secara luas, gunakan React Context daripada prop drilling.
- **Strategy Pattern**: Jika ada banyak kondisi `if-else` untuk tipe data berbeda, pisahkan menjadi handler-handler modular.
- **Service Layer**: Pastikan logic fetch API berada di `src/services/` atau `src/lib/api.ts`, bukan langsung di `useEffect`.

### 5. Verifikasi Integritas (Turboized)
// turbo
1. Jalankan type checking untuk memastikan semua interface tetap valid:
   `npx tsc --noEmit`
// turbo
2. Pastikan tidak ada regresi linter:
   `npm run lint`

### 6. Dokumentasi & Refinement
- Tambahkan **JSDoc** pada fungsi-fungsi baru untuk menjelaskan input/output.
- Hapus semua variabel, import, dan komentar "mati" yang sudah tidak dipakai.
- Gunakan `useMemo` atau `useCallback` hanya pada bagian yang terbukti menjadi bottleneck performa.

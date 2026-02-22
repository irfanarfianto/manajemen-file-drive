---
description: Prosedur Code Review mendalam dari perspektif Senior QA untuk memastikan kualitas, stabilitas, dan performa kode.
---

Sebagai Senior QA, fokus review bukan hanya pada "apakah kode berjalan", tapi "seberapa tahan banting kode ini di produksi". Ikuti langkah-langkah berikut:

### 1. Validasi Statis & Standar Kode
Langkah pertama untuk memastikan tidak ada "low-hanging fruit" error.
// turbo
1. Jalankan linting untuk memastikan standar penamaan dan penulisan terjaga:
   `npm run lint`
2. Jalankan type checking untuk memastikan integritas data:
   `npx tsc --noEmit`

### 2. Analisis Logika & Business Rules
Periksa file yang dimodifikasi dan cari potensi celah logika:
- **Edge Cases**: Apakah fungsi menangani nilai `null`, `undefined`, atau `empty array`?
- **Error Handling**: Apakah ada `try-catch` pada operasi asinkron/API? Apakah user mendapatkan toast message yang informatif?
- **Race Conditions**: Pada `useEffect` atau fetch, apakah ada cleanup function untuk mencegah memory leak atau update state pada component yang sudah unmounted?

### 3. Review Keamanan & Performa
- **Data Privacy**: Pastikan tidak ada API Key, Client ID Secrets, atau data sensitif yang di-hardcode (selalu gunakan `.env`).
- **Optimization**: Periksa penggunaan `useMemo` atau `useCallback` pada ketergantungan yang berat untuk mencegah re-render yang tidak perlu.
- **Payload**: Pastikan API request hanya mengambil field yang diperlukan (jangan `SELECT *` atau ambil seluruh meta-data jika hanya butuh ID).

### 4. Verifikasi UI/UX & Aksesibilitas
- **Responsivitas**: Cek apakah layout menggunakan utility class yang benar (misal: `hidden md:block`) untuk mobile vs desktop.
- **States**: Verifikasi adanya *Loading state* (skeleton/spinner) dan *Empty state* (ketika data kosong).
- **Interaksi**: Pastikan tombol memiliki state `disabled` saat proses loading untuk mencegah *double submission*.

### 5. Pengujian Integrasi (E2E Perspective)
Jika memungkinkan, lakukan verifikasi mandiri:
1. Jalankan aplikasi: `npm run dev`.
2. Lakukan simulasi "Happy Path" (alur normal).
3. Lakukan simulasi "Negative Path" (misal: memutus koneksi saat upload, memasukkan karakter aneh di input).

### 6. Rekomendasi Akhir
Berikan komentar dengan format:
- **[BLOCKER]**: Harus diperbaiki karena menyebabkan bug fatal atau security issue.
- **[CHORE]**: Saran perbaikan kecil/refactoring untuk maintainability.
- **[QUESTION]**: Meminta klarifikasi atas implementasi logika tertentu.

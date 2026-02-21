---
description: Prosedur troubleshooting masalah umum pada Google Drive API integration
---

# Workflow: Troubleshooting Drive API

Gunakan workflow ini saat menemukan masalah dengan integrasi Google Drive API.

---

## Masalah: "401 Unauthorized" dari Google API

### Kemungkinan penyebab:
1. Access token sudah expired
2. Scope tidak mencukupi
3. OAuth client ID/Secret salah

### Langkah diagnosa:
1. **Cek session di browser** → Buka DevTools → Application → Cookies → cari session cookie
2. **Cek console browser** → Lihat apakah ada error "401" pada request ke `/api/drive/*`
3. **Cek `.env.local`** → Verifikasi `GOOGLE_CLIENT_ID` dan `GOOGLE_CLIENT_SECRET` sudah benar
4. **Coba logout dan login kembali** → Token mungkin sudah kadaluarsa

---

## Masalah: "403 Forbidden" atau "Insufficient Permission"

### Kemungkinan penyebab:
Scope OAuth yang diminta tidak mencukupi.

### Solusi:
1. Buka `src/lib/auth.ts`
2. Pastikan scope mencakup yang diperlukan:
```typescript
authorization: {
  params: {
    scope: 'openid email profile https://www.googleapis.com/auth/drive',
  },
},
```
3. **Logout** dari aplikasi
4. **Login ulang** — Google akan meminta consent dengan scope baru

---

## Masalah: "redirect_uri_mismatch"

### Kemungkinan penyebab:
URI callback tidak terdaftar di Google Cloud Console.

### Solusi:
1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Pilih project → APIs & Services → Credentials
3. Klik OAuth 2.0 Client ID yang digunakan
4. Tambahkan Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://domain-produksi.com/api/auth/callback/google` (produksi)
5. Klik Save

---

## Masalah: File tidak muncul di list

### Langkah diagnosa:
1. Buka Browser DevTools → Network
2. Cari request ke `/api/drive/files`
3. Lihat response — apakah ada data? Apakah ada error?
4. Cek apakah `folderId` yang dikirim sudah benar (`root` untuk My Drive)
5. Pastikan user yang login memiliki akses ke folder tersebut

---

## Masalah: Upload gagal

### Kemungkinan penyebab:
1. Ukuran file terlalu besar (timeout)
2. MIME type tidak dikenali
3. Quota Google Drive penuh

### Solusi:
1. Cek ukuran file — batas upload resumable: 5TB, simple upload: 5MB
2. Untuk file > 5MB, gunakan **resumable upload** (`uploadType=resumable`)
3. Cek storage quota user di Google Drive

---

## Masalah: Perubahan tidak tersimpan / cache lama

### Solusi:
1. Pastikan setelah operasi mutasi (create/delete/rename), lakukan **refetch** file list
2. Gunakan cache-busting dengan menambahkan timestamp ke request jika perlu
3. Hard refresh browser: `Ctrl + Shift + R`

---

## Tools untuk Diagnosa

| Tool | Kegunaan |
|---|---|
| Browser DevTools Network | Lihat semua HTTP request/response |
| Browser DevTools Console | Lihat JavaScript errors |
| [Google OAuth Playground](https://developers.google.com/oauthplayground/) | Test token dan Drive API manually |
| [Google Drive API Explorer](https://developers.google.com/drive/api/v3/reference) | Coba endpoint Drive API langsung |
| Next.js terminal output | Lihat server-side errors |

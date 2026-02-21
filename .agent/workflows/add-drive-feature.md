---
description: Cara menambahkan fitur baru yang berinteraksi dengan Google Drive API
---

# Workflow: Menambahkan Fitur Drive API Baru

Ikuti langkah ini setiap kali menambahkan fitur baru yang berinteraksi dengan Google Drive API (upload, delete, rename, share, dll).

---

## Langkah-langkah

### 1. Definisikan tipe data di `src/types/`
Tambahkan atau perbarui tipe yang relevan:
```typescript
// src/types/drive.ts
export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  // tambahkan field yang diperlukan
}

export interface DriveApiResponse<T> {
  data: T;
  error?: string;
}
```

### 2. Buat helper Google Drive di `src/lib/google/`
Buat atau tambahkan fungsi ke file helper:
```typescript
// src/lib/google/driveService.ts
import { google } from 'googleapis';

/**
 * Deskripsi singkat apa yang dilakukan fungsi ini
 */
export async function namaFiturBaru(accessToken: string, params: TipeParams): Promise<TipeHasil> {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  
  const drive = google.drive({ version: 'v3', auth });
  
  // implementasi...
}
```

### 3. Buat API Route di Next.js
```typescript
// src/app/api/drive/[nama-fitur]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { namaFiturBaru } from '@/lib/google/driveService';

export async function POST(request: NextRequest) {
  // 1. Validasi session
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Parse & validasi request body
  const body = await request.json();
  if (!body.requiredField) {
    return NextResponse.json({ error: 'Field diperlukan tidak ada' }, { status: 400 });
  }

  // 3. Panggil service
  try {
    const result = await namaFiturBaru(session.accessToken, body);
    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('[API /drive/nama-fitur]', error);
    return NextResponse.json({ error: 'Operasi gagal' }, { status: 500 });
  }
}
```

### 4. Buat custom hook untuk UI
```typescript
// src/hooks/useNamaFitur.ts
import { useState } from 'react';

export function useNamaFitur() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function execute(params: TipeParams) {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/drive/nama-fitur', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Terjadi kesalahan');
      }

      const result = await res.json();
      return result.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }

  return { execute, isLoading, error };
}
```

### 5. Integrasikan ke komponen UI
Gunakan hook di dalam komponen:
```typescript
const { execute: jalankanFitur, isLoading, error } = useNamaFitur();

// Panggil saat user melakukan aksi
async function handleAction() {
  try {
    await jalankanFitur({ param: value });
    toast.success('Berhasil!');
    // refresh data jika perlu
  } catch {
    // error sudah ditangani di hook
  }
}
```

### 6. Checklist sebelum selesai
- [ ] Tipe TypeScript sudah didefinisikan
- [ ] API route sudah memvalidasi session
- [ ] Error handling ada di service, API route, dan hook
- [ ] Loading state ditampilkan di UI
- [ ] Toast/notifikasi sukses muncul setelah operasi berhasil
- [ ] Tidak ada credentials yang terekspos ke client
- [ ] Test manual di browser sudah dilakukan

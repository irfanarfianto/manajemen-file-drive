import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createFolder } from "@/lib/google/drive";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { title, parentId = "root" } = await request.json();
    const folderTitle = title || "Skripsi - Baru";

    // 1. Create Main Folder
    const mainFolder = await createFolder(session.accessToken as string, folderTitle, parentId);

    if (!mainFolder.id) {
      throw new Error("Gagal mendapatkan ID folder utama");
    }

    // 2. Define Sub-folders
    const subFolders = [
      "Bab 1 - Pendahuluan",
      "Bab 2 - Tinjauan Pustaka",
      "Bab 3 - Metodologi Penelitian",
      "Bab 4 - Hasil dan Pembahasan",
      "Bab 5 - Kesimpulan dan Saran",
      "📚 Referensi (Jurnal & Buku)",
      "📊 Data Penelitian & Lampiran",
      "📝 Draft Revisi (History)",
    ];

    // 3. Create Sub-folders concurrently
    await Promise.all(
      subFolders.map((name) =>
        createFolder(session.accessToken as string, name, mainFolder.id!)
      )
    );



    return NextResponse.json({ success: true, folderId: mainFolder.id });
  } catch (err: unknown) {
    console.error("[template-skripsi] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal membuat struktur skripsi" },
      { status: 500 }
    );
  }
}

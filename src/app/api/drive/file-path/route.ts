import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDriveClient } from "@/lib/google/drive";

// Traverse parents dari sebuah folder ke root, kembalikan path dari root → folder
async function buildFolderPath(
  drive: ReturnType<typeof getDriveClient>,
  folderId: string
): Promise<{ id: string; name: string; trashed?: boolean }[]> {
  const path: { id: string; name: string; trashed?: boolean }[] = [];
  let currentId = folderId;
  const visited = new Set<string>();

  while (currentId && currentId !== "root" && !visited.has(currentId)) {
    visited.add(currentId);
    try {
      const res = await drive.files.get({
        fileId: currentId,
        fields: "id,name,parents,trashed",
      });
      const f = res.data;
      path.unshift({ id: f.id!, name: f.name!, trashed: !!f.trashed });
      currentId = f.parents?.[0] ?? "";
    } catch {
      break;
    }
  }

  return path;
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const fileId = searchParams.get("fileId");
  if (!fileId) {
    return NextResponse.json({ error: "fileId required" }, { status: 400 });
  }

  const drive = getDriveClient(session.accessToken);

  try {
    // 1. Ambil info file/folder saat ini
    const fileRes = await drive.files.get({
      fileId,
      fields: "id,name,mimeType,parents,trashed",
    });
    const file = fileRes.data;
    const isFolder = file.mimeType === "application/vnd.google-apps.folder";

    // 2. Tentukan target ID untuk list isi:
    // Jika folder -> list isi di DALAMNYA. Jika file -> list saudaranya.
    const listParentId = isFolder ? file.id! : (file.parents?.[0] ?? "root");

    // 3. Build path
    // Jika folder -> path harus sampai folder itu sendiri. Jika file -> sampai parentnya saja.
    const folderPath = await buildFolderPath(drive, listParentId);
    
    // Cek apakah item ini atau parentnya ada di trash
    const isTrashed = !!file.trashed || folderPath.some(p => p.trashed);

    // 4. List isi (children atau siblings tergantung konteks)
    // Jika folder induk ada di trash, jangan filter 'trashed = false' tapi tampilkan juga anak-anaknya.
    const query = isTrashed
      ? `'${listParentId}' in parents`  // karena secara teknis anak folder trash bisa trashed=false
      : `'${listParentId}' in parents and trashed = false`;

    const contentsRes = await drive.files.list({
      q: query,
      fields: "files(id,name,mimeType,size,webViewLink,modifiedTime)",
      orderBy: "folder,name",
      pageSize: 50,
    });
    const siblings = contentsRes.data.files ?? [];

    return NextResponse.json({
      currentFile: { id: file.id, name: file.name, mimeType: file.mimeType, trashed: file.trashed },
      parentId: listParentId,
      folderPath,
      siblings,
      isTrashed,
    });
  } catch (err: unknown) {
    console.error("[api/drive/file-path] Error:", err);
    const message = err instanceof Error ? err.message : "Drive API error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

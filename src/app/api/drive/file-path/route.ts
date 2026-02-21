import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDriveClient } from "@/lib/google/drive";

// Traverse parents dari sebuah folder ke root, kembalikan path dari root → folder
async function buildFolderPath(
  drive: ReturnType<typeof getDriveClient>,
  folderId: string
): Promise<{ id: string; name: string }[]> {
  const path: { id: string; name: string }[] = [];
  let currentId = folderId;
  const visited = new Set<string>();

  while (currentId && currentId !== "root" && !visited.has(currentId)) {
    visited.add(currentId);
    try {
      const res = await drive.files.get({
        fileId: currentId,
        fields: "id,name,parents",
      });
      const f = res.data;
      path.unshift({ id: f.id!, name: f.name! });
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
    // 1. Ambil info file saat ini (termasuk parentnya)
    const fileRes = await drive.files.get({
      fileId,
      fields: "id,name,mimeType,parents",
    });
    const file = fileRes.data;
    const parentId = file.parents?.[0] ?? "root";

    // 2. Build path dari root → parent folder
    const folderPath = await buildFolderPath(drive, parentId);

    // 3. List file-file di folder yang sama (siblings)
    const siblingsRes = await drive.files.list({
      q: `'${parentId}' in parents and trashed = false`,
      fields: "files(id,name,mimeType,size,webViewLink,modifiedTime)",
      orderBy: "folder,name",
      pageSize: 50,
    });
    const siblings = siblingsRes.data.files ?? [];

    return NextResponse.json({
      currentFile: { id: file.id, name: file.name, mimeType: file.mimeType },
      parentId,
      folderPath,   // [{ id, name }, ...] dari root sampai parent langsung
      siblings,     // file & folder di folder yang sama
    });
  } catch (err: unknown) {
    console.error("[api/drive/file-path] Error:", err);
    const message = err instanceof Error ? err.message : "Drive API error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

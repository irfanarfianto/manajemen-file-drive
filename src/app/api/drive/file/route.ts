import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { deleteFile, renameFile, createFolder, restoreFile, permanentDeleteFile } from "@/lib/google/drive";

// DELETE (trash or permanent)
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { fileId, permanent } = await request.json();
  if (!fileId)
    return NextResponse.json({ error: "fileId required" }, { status: 400 });

  try {
    if (permanent) {
      await permanentDeleteFile(session.accessToken, fileId);
    } else {
      await deleteFile(session.accessToken, fileId);
    }
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH (rename or restore)
export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { fileId, name, restore } = await request.json();
  if (!fileId)
    return NextResponse.json({ error: "fileId required" }, { status: 400 });

  try {
    if (restore) {
      await restoreFile(session.accessToken, fileId);
      return NextResponse.json({ success: true });
    }
    
    if (!name)
      return NextResponse.json({ error: "name required for rename" }, { status: 400 });

    const file = await renameFile(session.accessToken, fileId, name);
    return NextResponse.json(file);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST (create folder)
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, parentId } = await request.json();
  if (!name)
    return NextResponse.json({ error: "name required" }, { status: 400 });

  try {
    const folder = await createFolder(session.accessToken, name, parentId);
    return NextResponse.json(folder);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

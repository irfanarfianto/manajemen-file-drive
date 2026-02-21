import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { batchDeleteFiles } from "@/lib/google/drive";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const fileIds = body.fileIds;

  if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
    return NextResponse.json(
      { error: "Daftar ID file diperlukan" },
      { status: 400 }
    );
  }

  try {
    await batchDeleteFiles(session.accessToken, fileIds);
    return NextResponse.json({ success: true, count: fileIds.length });
  } catch (error) {
    console.error("[API /drive/batch-delete]", error);
    return NextResponse.json({ error: "Gagal menghapus beberapa file" }, { status: 500 });
  }
}

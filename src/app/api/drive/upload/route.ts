import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadFile } from "@/lib/google/drive";
import { Readable } from "stream";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const parentId = (formData.get("parentId") as string) || "root";

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const uploadedFiles = [];

    for (const file of files) {
      // Convert Web File to Node.js Readable Stream
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const stream = Readable.from(buffer);

      const uploaded = await uploadFile(
        session.accessToken,
        file.name,
        file.type,
        stream,
        parentId
      );
      uploadedFiles.push(uploaded);
    }

    return NextResponse.json({ success: true, files: uploadedFiles });
  } catch (err: unknown) {
    console.error("[upload] error:", err);
    const message = err instanceof Error ? err.message : "Error uploading file";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

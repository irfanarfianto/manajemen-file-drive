import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { downloadFile, exportFile } from "@/lib/google/drive";
import { summarizeText } from "@/lib/gemini";

// Helper to convert stream to buffer
async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: any[] = [];
  return new Promise((resolve, reject) => {
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", (err) => reject(err));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
  });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { fileId, mimeType } = await request.json();

    if (!fileId) {
      return NextResponse.json({ error: "fileId required" }, { status: 400 });
    }

    let buffer: Buffer;
    let text = "";
    let summary = "";

    const isGoogleDoc = mimeType?.includes("google-apps.document");
    const isPdf = mimeType === "application/pdf";

    if (isGoogleDoc) {
      // Export Google Doc to plain text
      const stream = await exportFile(session.accessToken, fileId, "text/plain");
      buffer = await streamToBuffer(stream);
      text = buffer.toString("utf-8");
      
      if (!text.trim()) {
        return NextResponse.json({ error: "File kosong atau tidak terbaca." }, { status: 400 });
      }
      summary = await summarizeText(text);

    } else if (isPdf) {
      // Download PDF and let Gemini process it natively
      const { data: stream } = await downloadFile(session.accessToken, fileId);
      buffer = await streamToBuffer(stream);
      
      if (buffer.length === 0) {
       return NextResponse.json({ error: "File PDF kosong." }, { status: 400 });
      }
      
      summary = await summarizeText({ buffer, mimeType: "application/pdf" });

    } else if (mimeType?.startsWith("text/")) {
      // Plain text files
      const { data: stream } = await downloadFile(session.accessToken, fileId);
      buffer = await streamToBuffer(stream);
      text = buffer.toString("utf-8");
      
      if (!text.trim()) {
        return NextResponse.json({ error: "File kosong atau tidak terbaca." }, { status: 400 });
      }
      summary = await summarizeText(text);

    } else {
      return NextResponse.json(
        { error: "Tipe file ini tidak didukung untuk peringkasan saat ini." },
        { status: 400 }
      );
    }

    return NextResponse.json({ summary });

  } catch (err: unknown) {
    console.error("[summarize] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal meringkas file" },
      { status: 500 }
    );
  }
}

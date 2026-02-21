import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { downloadFile, exportFile, getDriveClient } from "@/lib/google/drive";

function nodeStreamToWebStream(nodeStream: NodeJS.ReadableStream): ReadableStream {
  return new ReadableStream({
    start(controller) {
      nodeStream.on("data", (chunk) => { controller.enqueue(chunk); });
      nodeStream.on("end", () => { controller.close(); });
      nodeStream.on("error", (err) => { controller.error(err); });
    },
    cancel() {
      const stream = nodeStream as unknown as { destroy?: () => void };
      if (typeof stream.destroy === "function") {
        stream.destroy();
      }
    },
  });
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get("fileId");

  if (!fileId) {
    return new Response("fileId required", { status: 400 });
  }

  try {
    const drive = getDriveClient(session.accessToken);
    const file = await drive.files.get({
      fileId,
      fields: "mimeType",
      supportsAllDrives: true,
    });

    const mimeType = file.data.mimeType || "";

    // Google Workspace (Docs, Sheets, Slides) → export sebagai PDF untuk iframe
    if (mimeType.includes("google-apps")) {
      const stream = await exportFile(session.accessToken, fileId, "application/pdf");
      return new Response(nodeStreamToWebStream(stream), {
        headers: { "Content-Type": "application/pdf", "Content-Disposition": "inline" },
      });
    }

    // File lain (PDF, gambar, teks, video, audio) → stream langsung
    const { data: stream, mimeType: downloadMimeType } = await downloadFile(
      session.accessToken,
      fileId
    );

    return new Response(nodeStreamToWebStream(stream), {
      headers: { "Content-Type": downloadMimeType, "Content-Disposition": "inline" },
    });
  } catch (err: unknown) {
    console.error("[preview] error:", err);
    return new Response("Error previewing file", { status: 500 });
  }
}

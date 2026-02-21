import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { downloadFile, exportFile, getDriveClient } from "@/lib/google/drive";

// Format Office yang dikonversi ke PDF via Google Drive copy + export
const OFFICE_TO_PDF_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/msword",                                                        // .doc
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",        // .xlsx
  "application/vnd.ms-excel",                                                  // .xls
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",// .pptx
  "application/vnd.ms-powerpoint",                                             // .ppt
  "application/vnd.oasis.opendocument.text",                                   // .odt
  "application/vnd.oasis.opendocument.spreadsheet",                            // .ods
  "application/vnd.oasis.opendocument.presentation",                           // .odp
]);

function nodeStreamToWebStream(nodeStream: NodeJS.ReadableStream): ReadableStream {
  return new ReadableStream({
    start(controller) {
      nodeStream.on("data", (chunk) => { controller.enqueue(chunk); });
      nodeStream.on("end", () => { controller.close(); });
      nodeStream.on("error", (err) => { controller.error(err); });
    },
    cancel() {
      if (typeof (nodeStream as any).destroy === "function") {
        (nodeStream as any).destroy();
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

    // 1. Google Workspace docs (Docs, Sheets, Slides) → export langsung ke PDF
    if (mimeType.includes("google-apps")) {
      const stream = await exportFile(session.accessToken, fileId, "application/pdf");
      return new Response(nodeStreamToWebStream(stream), {
        headers: { "Content-Type": "application/pdf", "Content-Disposition": "inline" },
      });
    }

    // 2. Format Office (DOCX, XLSX, PPTX, dll) → salin ke Drive lalu export PDF
    if (OFFICE_TO_PDF_TYPES.has(mimeType)) {
      try {
        const copyRes = await drive.files.copy({
          fileId,
          requestBody: { name: `__preview_temp_${fileId}` },
        });
        const copyId = copyRes.data.id!;

        const stream = await exportFile(session.accessToken, copyId, "application/pdf");
        // Hapus salinan sementara (non-blocking)
        drive.files.delete({ fileId: copyId }).catch(() => {});

        return new Response(nodeStreamToWebStream(stream), {
          headers: { "Content-Type": "application/pdf", "Content-Disposition": "inline" },
        });
      } catch (convErr) {
        console.warn("[preview] Office conversion failed, falling back to raw stream:", convErr);
        // Fallback ke stream langsung kalau konversi gagal
      }
    }

    // 3. File lain (PDF, gambar, video, teks, dll) → stream langsung
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

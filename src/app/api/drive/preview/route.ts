import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { downloadFile, exportFile, getDriveClient } from "@/lib/google/drive";

function nodeStreamToWebStream(nodeStream: NodeJS.ReadableStream): ReadableStream {
  return new ReadableStream({
    start(controller) {
      nodeStream.on("data", (chunk) => {
        controller.enqueue(chunk);
      });
      nodeStream.on("end", () => {
        controller.close();
      });
      nodeStream.on("error", (err) => {
        controller.error(err);
      });
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
    // Get file info first to check mimeType
    const drive = getDriveClient(session.accessToken);
    const file = await drive.files.get({
      fileId,
      fields: "mimeType",
      supportsAllDrives: true,
    });
    
    const mimeType = file.data.mimeType || "";

    if (mimeType.includes("google-apps")) {
      // Export as PDF for previewing Google Workspace documents safely without requiring external Google Login via iframes
      const stream = await exportFile(session.accessToken, fileId, "application/pdf");
      const webStream = nodeStreamToWebStream(stream);
      return new Response(webStream, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": "inline",
        },
      });
    } else {
      // Directly download and pipe native files (PDFs, images, etc.)
      const { data: stream, mimeType: downloadMimeType } = await downloadFile(
        session.accessToken,
        fileId
      );

      const webStream = nodeStreamToWebStream(stream);
      return new Response(webStream, {
        headers: {
          "Content-Type": downloadMimeType,
          "Content-Disposition": "inline",
        },
      });
    }
  } catch (err: unknown) {
    console.error("[preview] error:", err);
    return new Response("Error previewing file", { status: 500 });
  }
}

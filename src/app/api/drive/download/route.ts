import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { downloadFile } from "@/lib/google/drive";

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
    const { data: stream, mimeType } = await downloadFile(
      session.accessToken,
      fileId
    );

    // Create a generic response from the stream
    return new Response(stream as unknown as ReadableStream, {
      headers: {
        "Content-Type": mimeType,
      },
    });
  } catch (err: unknown) {
    console.error("[download] error:", err);
    return new Response("Error downloading file", { status: 500 });
  }
}


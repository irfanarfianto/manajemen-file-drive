import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listFiles, searchFiles } from "@/lib/google/drive";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const folderId = searchParams.get("folderId") ?? "root";
  const query = searchParams.get("q") ?? "";
  const pageToken = searchParams.get("pageToken") ?? undefined;
  const orderBy = searchParams.get("orderBy") ?? undefined;

  try {
    if (query) {
      const files = await searchFiles(session.accessToken, query);
      return NextResponse.json({ files });
    }

    const result = await listFiles(session.accessToken, {
      folderId,
      pageToken,
      orderBy,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("[api/drive/files] Error:", err);
    const message = err instanceof Error ? err.message : "Drive API error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

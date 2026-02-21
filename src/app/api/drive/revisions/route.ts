import { NextResponse } from "next/server";
import { getRevisions } from "@/lib/google/drive";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: Request
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("fileId");

    if (!fileId) {
      return NextResponse.json(
        { error: "fileId is required" },
        { status: 400 }
      );
    }

    const revisions = await getRevisions(session.accessToken, fileId);

    return NextResponse.json({ revisions });
  } catch (error: any) {
    console.error("Failed to fetch file revisions:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch file revisions" },
      { status: 500 }
    );
  }
}

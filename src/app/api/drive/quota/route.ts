import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getStorageQuota } from "@/lib/google/drive";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const quota = await getStorageQuota(session.accessToken);
    return NextResponse.json(quota);
  } catch (err: unknown) {
    console.error("[api/drive/quota] Error:", err);
    const message = err instanceof Error ? err.message : "Drive API error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

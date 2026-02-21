import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { updateFileProperties } from "@/lib/google/drive";

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { fileId, tags } = await request.json();

    if (!fileId) {
      return NextResponse.json({ error: "fileId required" }, { status: 400 });
    }

    // GDrive properties are key-value. 
    // We'll store tags as keys with value "true" for simplicity, 
    // or a single key "tags" with comma separated values.
    // Let's use individual keys with prefix 'tag_' to avoid collisions.
    
    // Convert array of tags to property object
    // Note: To delete a property, set it to null.
    // For now we just ADD/SET.
    const properties: Record<string, string> = {};
    if (Array.isArray(tags)) {
      tags.forEach(tag => {
        properties[`tag_${tag}`] = "true";
      });
    }

    const updatedFile = await updateFileProperties(
      session.accessToken,
      fileId,
      properties
    );

    return NextResponse.json(updatedFile);
  } catch (err: unknown) {
    console.error("[tags] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal update tags" },
      { status: 500 }
    );
  }
}

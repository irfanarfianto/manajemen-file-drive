import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getKanbanData, saveKanbanData } from "@/lib/google/drive";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await getKanbanData(session.accessToken);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Failed to fetch Kanban data:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch Kanban data" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    await saveKanbanData(session.accessToken, body);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to save Kanban data:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save Kanban data" },
      { status: 500 }
    );
  }
}

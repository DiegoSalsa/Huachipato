import { listSessions } from "@/backend/api/sessions";
import { NextResponse } from "next/server";

export async function GET() {
  const sessions = await listSessions();

  return NextResponse.json(sessions);
}

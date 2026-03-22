import { listPlayers } from "@/backend/api/players";
import { NextResponse } from "next/server";

export async function GET() {
  const players = await listPlayers();

  return NextResponse.json(players);
}

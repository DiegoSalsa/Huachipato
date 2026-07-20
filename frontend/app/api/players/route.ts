import { listPlayers, createPlayer } from "@/lib/api/players";
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext, unauthorized } from "@/lib/server-auth";

export async function GET(request: NextRequest) {
  const context = await getRequestContext(request);
  if (!context) return unauthorized();
  const players = await listPlayers(context.squad);
  return NextResponse.json(players);
}

export async function POST(request: NextRequest) {
  try {
    const context = await getRequestContext(request, ["gps", "admin"]);
    if (!context) return unauthorized();
    const body = await request.json();
    const { name, position } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "El nombre del jugador es obligatorio" },
        { status: 400 },
      );
    }

    const validPositions = ["PORTERO", "DEFENSA", "MEDIOCAMPISTA", "DELANTERO"];
    if (!validPositions.includes(position)) {
      return NextResponse.json(
        { error: "Posición inválida" },
        { status: 400 },
      );
    }

    const player = await createPlayer(name.trim(), position, context.squad);
    return NextResponse.json(player, { status: 201 });
  } catch (err) {
    if (
      err instanceof Error &&
      err.message.includes("Unique constraint failed")
    ) {
      return NextResponse.json(
        { error: "Ya existe un jugador con ese nombre" },
        { status: 409 },
      );
    }
    console.error("Create player error:", err);
    return NextResponse.json(
      { error: "Error al crear jugador" },
      { status: 500 },
    );
  }
}

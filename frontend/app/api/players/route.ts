import { listPlayers, createPlayer } from "@/lib/api/players";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const players = await listPlayers();
  return NextResponse.json(players);
}

export async function POST(request: NextRequest) {
  try {
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

    const player = await createPlayer(name.trim(), position);
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

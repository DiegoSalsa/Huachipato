import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestContext, unauthorized } from "@/lib/server-auth";

export async function GET(request: NextRequest) {
  try {
    const context = await getRequestContext(request, ["medico", "admin"]);
    if (!context) return unauthorized();
    const injuries = await prisma.injury.findMany({
      where: { player: { squad: context.squad } },
      include: { player: true },
      orderBy: { dateOfInjury: "desc" },
    });
    return NextResponse.json(injuries);
  } catch (error) {
    console.error("Error fetching injuries:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const context = await getRequestContext(request, ["medico"]);
    if (!context) return unauthorized();
    const body = await request.json();
    const { playerId, injuryType, severity, dateOfInjury, estimatedRecoveryDays, status, description } = body;

    if (!playerId || !injuryType || !severity || !dateOfInjury || !estimatedRecoveryDays || !status) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
    }

    const player = await prisma.player.findFirst({
      where: { id: playerId, squad: context.squad },
      select: { id: true },
    });
    if (!player) {
      return NextResponse.json({ error: "Jugador no encontrado en esta serie" }, { status: 404 });
    }

    const injury = await prisma.injury.create({
      data: {
        playerId,
        injuryType,
        severity,
        dateOfInjury: new Date(dateOfInjury),
        estimatedRecoveryDays: parseInt(estimatedRecoveryDays, 10),
        status,
        description,
      },
      include: { player: true }, // Retornar con el jugador para actualizar la UI fácilmente
    });

    return NextResponse.json(injury, { status: 201 });
  } catch (error) {
    console.error("Error creating injury:", error);
    return NextResponse.json({ error: "Error al registrar la lesión" }, { status: 500 });
  }
}

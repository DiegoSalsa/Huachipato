import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const injuries = await prisma.injury.findMany({
      include: { player: true },
      orderBy: { dateOfInjury: "desc" },
    });
    return NextResponse.json(injuries);
  } catch (error) {
    console.error("Error fetching injuries:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { playerId, injuryType, severity, dateOfInjury, estimatedRecoveryDays, status, description } = body;

    if (!playerId || !injuryType || !severity || !dateOfInjury || !estimatedRecoveryDays || !status) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
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

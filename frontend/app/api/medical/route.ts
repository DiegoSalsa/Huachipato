import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const playerId = searchParams.get("playerId");

  const where: Record<string, unknown> = {};
  if (playerId) where.playerId = parseInt(playerId, 10);

  const records = await prisma.medicalRecord.findMany({
    where,
    include: { player: true },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(records);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { playerId, date, weight, height, fatPct, musclePct, jumpCMJ, sprint10m, status, notes } = body;

    if (!playerId || !date) {
      return NextResponse.json({ error: "playerId and date are required" }, { status: 400 });
    }

    const record = await prisma.medicalRecord.create({
      data: {
        playerId: parseInt(playerId, 10),
        date: new Date(date),
        weight: weight ? parseFloat(weight) : null,
        height: height ? parseFloat(height) : null,
        fatPct: fatPct ? parseFloat(fatPct) : null,
        musclePct: musclePct ? parseFloat(musclePct) : null,
        jumpCMJ: jumpCMJ ? parseFloat(jumpCMJ) : null,
        sprint10m: sprint10m ? parseFloat(sprint10m) : null,
        status: status || "Estable",
        notes: notes || "",
      },
    });

    return NextResponse.json(record, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create medical record" }, { status: 500 });
  }
}

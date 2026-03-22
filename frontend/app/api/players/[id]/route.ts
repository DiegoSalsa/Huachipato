import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const playerId = parseInt(id, 10);

  if (isNaN(playerId)) {
    return NextResponse.json({ error: "Invalid player ID" }, { status: 400 });
  }

  const player = await prisma.player.findUnique({
    where: { id: playerId },
    include: {
      metrics: {
        include: {
          session: true,
          segment: true,
        },
        orderBy: { session: { date: "desc" } },
      },
      medicalRecords: {
        orderBy: { date: "desc" },
      },
    },
  });

  if (!player) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  return NextResponse.json(player);
}

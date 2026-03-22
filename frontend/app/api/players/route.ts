import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const players = await prisma.player.findMany({
    orderBy: { name: "asc" },
    include: {
      metrics: {
        where: { segmentId: null },
        orderBy: { session: { date: "desc" } },
        take: 1,
        include: { session: true },
      },
    },
  });

  return NextResponse.json(players);
}

import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");
  const segmentId = searchParams.get("segmentId");
  const playerId = searchParams.get("playerId");

  const where: Record<string, unknown> = {};

  if (sessionId) where.sessionId = parseInt(sessionId, 10);
  if (playerId) where.playerId = parseInt(playerId, 10);

  // segmentId=null means "entire session", segmentId=<number> means specific segment
  if (segmentId === "null" || segmentId === "") {
    where.segmentId = null;
  } else if (segmentId) {
    where.segmentId = parseInt(segmentId, 10);
  }

  const metrics = await prisma.playerMetric.findMany({
    where,
    include: {
      player: true,
      session: true,
      segment: true,
    },
    orderBy: { totalDistance: "desc" },
  });

  // Calculate averages
  if (metrics.length > 0) {
    const avg = {
      totalDistance: Math.round(metrics.reduce((s, m) => s + m.totalDistance, 0) / metrics.length),
      dMin: Math.round(metrics.reduce((s, m) => s + m.dMin, 0) / metrics.length),
      maxSpeed: +(metrics.reduce((s, m) => s + m.maxSpeed, 0) / metrics.length).toFixed(2),
      hsr: Math.round(metrics.reduce((s, m) => s + m.hsr, 0) / metrics.length),
      distZ6: Math.round(metrics.reduce((s, m) => s + m.distZ6, 0) / metrics.length),
      acc: Math.round(metrics.reduce((s, m) => s + m.acc, 0) / metrics.length),
      dec: Math.round(metrics.reduce((s, m) => s + m.dec, 0) / metrics.length),
    };
    return NextResponse.json({ metrics, averages: avg });
  }

  return NextResponse.json({ metrics, averages: null });
}

import { prisma } from "@/backend/lib/db";

type MetricsFilters = {
  sessionId?: number;
  segmentId?: number | null;
  playerId?: number;
};

export async function listMetricsWithAverages(filters: MetricsFilters) {
  const where: Record<string, number | null> = {};

  if (typeof filters.sessionId === "number" && Number.isFinite(filters.sessionId)) {
    where.sessionId = filters.sessionId;
  }

  if (typeof filters.playerId === "number" && Number.isFinite(filters.playerId)) {
    where.playerId = filters.playerId;
  }

  if (filters.segmentId === null) {
    where.segmentId = null;
  } else if (typeof filters.segmentId === "number" && Number.isFinite(filters.segmentId)) {
    where.segmentId = filters.segmentId;
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

  if (metrics.length === 0) {
    return { metrics, averages: null };
  }

  const averages = {
    totalDistance: Math.round(metrics.reduce((sum, item) => sum + item.totalDistance, 0) / metrics.length),
    dMin: Math.round(metrics.reduce((sum, item) => sum + item.dMin, 0) / metrics.length),
    maxSpeed: +(metrics.reduce((sum, item) => sum + item.maxSpeed, 0) / metrics.length).toFixed(2),
    hsr: Math.round(metrics.reduce((sum, item) => sum + item.hsr, 0) / metrics.length),
    distZ6: Math.round(metrics.reduce((sum, item) => sum + item.distZ6, 0) / metrics.length),
    acc: Math.round(metrics.reduce((sum, item) => sum + item.acc, 0) / metrics.length),
    dec: Math.round(metrics.reduce((sum, item) => sum + item.dec, 0) / metrics.length),
  };

  return { metrics, averages };
}

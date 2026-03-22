import { prisma } from "@/backend/lib/db";

export async function listSessions() {
  return prisma.session.findMany({
    orderBy: { date: "desc" },
    include: {
      segments: true,
      _count: { select: { metrics: true } },
    },
  });
}

export async function getSessionById(sessionId: number) {
  return prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      segments: true,
      metrics: {
        include: {
          player: true,
          segment: true,
        },
        orderBy: { totalDistance: "desc" },
      },
    },
  });
}

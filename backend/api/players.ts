import { prisma } from "@/backend/lib/db";

export async function listPlayers() {
  return prisma.player.findMany({
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
}

export async function getPlayerById(playerId: number) {
  return prisma.player.findUnique({
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
}

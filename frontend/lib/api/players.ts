import { prisma } from "@/lib/prisma";
import type { Position } from "@prisma/client";

export async function listPlayers() {
  return prisma.player.findMany({
    orderBy: { name: "asc" },
    include: {
      weeklyStats: {
        orderBy: [{ year: "desc" }, { weekNumber: "desc" }],
        take: 1,
      },
    },
  });
}

export async function getPlayerById(playerId: string) {
  return prisma.player.findUnique({
    where: { id: playerId },
    include: {
      weeklyStats: {
        orderBy: [{ year: "desc" }, { weekNumber: "desc" }],
      },
      gpsDailyReports: {
        orderBy: { date: "desc" },
        take: 30,
      },
    },
  });
}

export async function createPlayer(name: string, position: Position) {
  return prisma.player.create({
    data: { name, position },
  });
}

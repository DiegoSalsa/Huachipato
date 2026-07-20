import { prisma } from "@/lib/prisma";
import type { Position } from "@prisma/client";
import type { Squad } from "@/lib/squads";

export async function listPlayers(squad: Squad) {
  return prisma.player.findMany({
    where: { squad },
    orderBy: { name: "asc" },
    include: {
      weeklyStats: {
        orderBy: [{ year: "desc" }, { weekNumber: "desc" }],
        take: 1,
      },
    },
  });
}

export async function getPlayerById(playerId: string, squad: Squad) {
  return prisma.player.findFirst({
    where: { id: playerId, squad },
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

export async function createPlayer(name: string, position: Position, squad: Squad) {
  return prisma.player.create({
    data: { name, position, squad },
  });
}

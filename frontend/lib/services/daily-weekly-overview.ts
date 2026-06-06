import { prisma } from "@/lib/prisma";
import { getISOWeek } from "@/lib/services/weekly-aggregator";

/**
 * Daily / Weekly Overview Service
 *
 * Returns two views for a given date:
 *   1. "Today" — Per-player metrics for that specific date (from gps_daily_reports)
 *   2. "This Week" — Per-player accumulated metrics for the ISO week containing that date
 *      (sum of daily reports Mon→Sun, NOT the ACWR calculation)
 */

export interface PlayerDailyMetrics {
  playerId: string;
  playerName: string;
  position: string;
  totalDistance: number;
  hsr: number;
  sprintDistance: number;
  sprints: number;
  accelerations: number;
  decelerations: number;
  sessionsCount: number;
}

export interface PlayerWeeklyMetrics {
  playerId: string;
  playerName: string;
  position: string;
  totalDistance: number;
  hsr: number;
  sprintDistance: number;
  sprints: number;
  accelerations: number;
  decelerations: number;
  daysWithData: number;
}

export interface DailyWeeklyOverview {
  date: string;
  year: number;
  weekNumber: number;
  weekLabel: string;
  daily: PlayerDailyMetrics[];
  weekly: PlayerWeeklyMetrics[];
}

/**
 * Get the Monday and Sunday of the ISO week containing the given date.
 */
function getWeekRange(date: Date): { monday: Date; sunday: Date } {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayOfWeek = d.getUTCDay() || 7; // Sunday=7
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() - (dayOfWeek - 1));
  monday.setUTCHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  sunday.setUTCHours(23, 59, 59, 999);
  return { monday, sunday };
}

/**
 * Fetch the daily + weekly overview for a given date.
 */
export async function getDailyWeeklyOverview(
  targetDate: Date,
): Promise<DailyWeeklyOverview> {
  const { year, week: weekNumber } = getISOWeek(targetDate);
  const { monday, sunday } = getWeekRange(targetDate);

  // Normalize target date to UTC start/end for matching a full day
  const dayStart = new Date(Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate()));
  const dayEnd = new Date(dayStart);
  dayEnd.setUTCHours(23, 59, 59, 999);

  // ─── 1. Today's data ──────────────────────────────────────────
  const dailyReports = await prisma.gpsDailyReport.findMany({
    where: { date: { gte: dayStart, lte: dayEnd } },
    include: { player: true },
    orderBy: { player: { name: "asc" } },
  });

  // Count sessions per player for this day
  const sessionCounts = await prisma.gpsDailySession.groupBy({
    by: ["playerId"],
    where: { date: { gte: dayStart, lte: dayEnd } },
    _count: { id: true },
  });
  const sessionMap = new Map(sessionCounts.map((s) => [s.playerId, s._count.id]));

  const daily: PlayerDailyMetrics[] = dailyReports.map((r) => ({
    playerId: r.playerId,
    playerName: r.player.name,
    position: r.player.position,
    totalDistance: r.totalDistance,
    hsr: r.hsr,
    sprintDistance: r.sprintDistance,
    sprints: r.sprints,
    accelerations: r.accelerations,
    decelerations: r.decelerations,
    sessionsCount: sessionMap.get(r.playerId) ?? 1,
  }));

  // ─── 2. This week's accumulated data ──────────────────────────
  const weeklyReports = await prisma.gpsDailyReport.findMany({
    where: {
      date: { gte: monday, lte: sunday },
    },
    include: { player: true },
  });

  // Group by player and sum
  const playerWeekMap = new Map<
    string,
    {
      player: { id: string; name: string; position: string };
      totalDistance: number;
      hsr: number;
      sprintDistance: number;
      sprints: number;
      accelerations: number;
      decelerations: number;
      dates: Set<string>;
    }
  >();

  for (const r of weeklyReports) {
    const existing = playerWeekMap.get(r.playerId);
    if (existing) {
      existing.totalDistance += r.totalDistance;
      existing.hsr += r.hsr;
      existing.sprintDistance += r.sprintDistance;
      existing.sprints += r.sprints;
      existing.accelerations += r.accelerations;
      existing.decelerations += r.decelerations;
      existing.dates.add(r.date.toISOString().split("T")[0]);
    } else {
      playerWeekMap.set(r.playerId, {
        player: { id: r.playerId, name: r.player.name, position: r.player.position },
        totalDistance: r.totalDistance,
        hsr: r.hsr,
        sprintDistance: r.sprintDistance,
        sprints: r.sprints,
        accelerations: r.accelerations,
        decelerations: r.decelerations,
        dates: new Set([r.date.toISOString().split("T")[0]]),
      });
    }
  }

  const weekly: PlayerWeeklyMetrics[] = Array.from(playerWeekMap.values())
    .map((v) => ({
      playerId: v.player.id,
      playerName: v.player.name,
      position: v.player.position,
      totalDistance: v.totalDistance,
      hsr: v.hsr,
      sprintDistance: v.sprintDistance,
      sprints: v.sprints,
      accelerations: v.accelerations,
      decelerations: v.decelerations,
      daysWithData: v.dates.size,
    }))
    .sort((a, b) => a.playerName.localeCompare(b.playerName));

  // Week label: "Lun 19 May – Dom 25 May"
  const fmtShort = (d: Date) =>
    d.toLocaleDateString("es-CL", {
      weekday: "short",
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    });
  const weekLabel = `${fmtShort(monday)} – ${fmtShort(sunday)}`;

  return {
    date: dayStart.toISOString(),
    year,
    weekNumber,
    weekLabel,
    daily,
    weekly,
  };
}

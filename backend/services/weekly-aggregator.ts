import { prisma } from "@/backend/lib/db";

/**
 * Weekly Aggregator Service
 *
 * Aggregates gps_daily_reports into weekly_stats.
 *
 * For a given player and week:
 *   total_distance    = SUM(total_distance) from daily reports
 *   high_velocity     = SUM(hsr + sprint_distance)
 *   mechanical_impacts = SUM(sprints + accelerations + decelerations)
 */

/**
 * Get ISO week number from a Date.
 */
export function getISOWeek(date: Date): { year: number; week: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { year: d.getUTCFullYear(), week: weekNo };
}

/**
 * Aggregate daily reports for a specific player and week into a weekly stat.
 * Upserts the weekly_stats row.
 */
export async function aggregateWeekForPlayer(
  playerId: string,
  year: number,
  weekNumber: number,
) {
  // Get the date range for this ISO week
  const startOfWeek = getDateFromISOWeek(year, weekNumber, 1); // Monday
  const endOfWeek = getDateFromISOWeek(year, weekNumber, 7);   // Sunday end
  endOfWeek.setHours(23, 59, 59, 999);

  const dailyReports = await prisma.gpsDailyReport.findMany({
    where: {
      playerId,
      date: {
        gte: startOfWeek,
        lte: endOfWeek,
      },
    },
  });

  if (dailyReports.length === 0) return null;

  const totalDistance = dailyReports.reduce((sum, r) => sum + r.totalDistance, 0);
  const highVelocity = dailyReports.reduce(
    (sum, r) => sum + r.hsr + r.sprintDistance,
    0,
  );
  const mechanicalImpacts = dailyReports.reduce(
    (sum, r) => sum + r.sprints + r.accelerations + r.decelerations,
    0,
  );

  return prisma.weeklyStat.upsert({
    where: {
      playerId_year_weekNumber: {
        playerId,
        year,
        weekNumber,
      },
    },
    update: { totalDistance, highVelocity, mechanicalImpacts },
    create: {
      playerId,
      year,
      weekNumber,
      totalDistance,
      highVelocity,
      mechanicalImpacts,
    },
  });
}

/**
 * Aggregate all affected weeks after a bulk upload of daily reports.
 * Determines which (player, year, week) combos need recalculation.
 */
export async function aggregateAllAffectedWeeks(
  playerIds: string[],
  dates: Date[],
) {
  // Determine unique (player, year, week) combos
  const seen = new Set<string>();
  const combos: { playerId: string; year: number; week: number }[] = [];

  for (const playerId of playerIds) {
    for (const date of dates) {
      const { year, week } = getISOWeek(date);
      const key = `${playerId}_${year}_${week}`;
      if (!seen.has(key)) {
        seen.add(key);
        combos.push({ playerId, year, week });
      }
    }
  }

  const results = await Promise.all(
    combos.map((c) => aggregateWeekForPlayer(c.playerId, c.year, c.week)),
  );

  return results.filter(Boolean);
}

/**
 * Get a Date from ISO year, week number, and day of week (1=Monday, 7=Sunday).
 */
function getDateFromISOWeek(year: number, week: number, dayOfWeek: number): Date {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dayOfWeekJan4 = jan4.getUTCDay() || 7;
  const mondayOfWeek1 = new Date(jan4.getTime());
  mondayOfWeek1.setUTCDate(jan4.getUTCDate() - (dayOfWeekJan4 - 1));
  const target = new Date(mondayOfWeek1.getTime());
  target.setUTCDate(mondayOfWeek1.getUTCDate() + (week - 1) * 7 + (dayOfWeek - 1));
  return target;
}

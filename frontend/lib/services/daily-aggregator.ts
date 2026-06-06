import { PrismaClient, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getISOWeek } from "@/lib/services/weekly-aggregator";

/**
 * Daily Aggregator Service
 *
 * Sums all gps_daily_sessions for a given (playerId, date) and upserts
 * the result into gps_daily_reports (the day-level aggregate).
 *
 * Accepts a Prisma transaction client (`tx`) so that the aggregation
 * participates in the caller's transaction — ensuring atomicity.
 *
 * Flow:
 *   gps_daily_sessions  →  SUM  →  gps_daily_reports
 */

// Type for Prisma interactive transaction client
type TxClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

const ZERO_METRICS = {
  totalDistance: 0,
  hsr: 0,
  sprintDistance: 0,
  sprints: 0,
  accelerations: 0,
  decelerations: 0,
};

/**
 * Aggregate all sessions for a single player on a single date.
 * Upserts the totals into gps_daily_reports.
 *
 * If no sessions exist for the (playerId, date), the daily report
 * is deleted to keep the data consistent.
 */
export async function aggregateDailySessions(
  playerId: string,
  date: Date,
  tx?: TxClient,
): Promise<void> {
  const db = tx ?? prisma;
  const sessions = await db.gpsDailySession.findMany({
    where: { playerId, date },
  });

  // If all sessions were deleted, remove the daily report too
  if (sessions.length === 0) {
    await db.gpsDailyReport.deleteMany({
      where: { playerId, date },
    });
    return;
  }

  // Sum all session metrics
  const totals = sessions.reduce(
    (acc, s) => ({
      totalDistance: acc.totalDistance + s.totalDistance,
      hsr: acc.hsr + s.hsr,
      sprintDistance: acc.sprintDistance + s.sprintDistance,
      sprints: acc.sprints + s.sprints,
      accelerations: acc.accelerations + s.accelerations,
      decelerations: acc.decelerations + s.decelerations,
    }),
    { ...ZERO_METRICS },
  );

  const { year, week: weekNumber } = getISOWeek(date);

  await db.gpsDailyReport.upsert({
    where: {
      playerId_date: { playerId, date },
    },
    update: {
      ...totals,
      year,
      weekNumber,
    },
    create: {
      playerId,
      date,
      year,
      weekNumber,
      ...totals,
    },
  });
}

/**
 * Aggregate daily sessions for multiple players on a given date.
 * Convenience wrapper for batch operations.
 */
export async function aggregateDailySessionsBatch(
  playerIds: string[],
  date: Date,
  tx?: TxClient,
): Promise<void> {
  const uniqueIds = [...new Set(playerIds)];
  for (const playerId of uniqueIds) {
    await aggregateDailySessions(playerId, date, tx);
  }
}

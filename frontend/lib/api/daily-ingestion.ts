import { prisma } from "@/lib/prisma";
import { normalizeName, parseFloatSafe, parseIntSafe } from "@/lib/utils";
import { parse } from "csv-parse/sync";
import { getISOWeek, aggregateWeekForPlayer } from "@/lib/services/weekly-aggregator";
import { aggregateDailySessionsBatch } from "@/lib/services/daily-aggregator";

// ─── Types ──────────────────────────────────────────────────────────

export type DailyCsvUploadResult = {
  mode: "daily-csv";
  success: boolean;
  sessionsCreated: number;
  playersCreated: number;
  weeksAggregated: number;
  date: string;
  sessionNumber: number;
  columns: string[];
  preview: Record<string, unknown>[];
};

// ─── CSV Column Mapping ─────────────────────────────────────────────
//
// S-Files use semicolon (;) as delimiter.
// Strict column names from GPS devices with common variants.

const CSV_COL_MAP: Record<string, string> = {
  // Player name
  "Player Name": "playerName",
  "player name": "playerName",
  "Nombre": "playerName",
  "Name": "playerName",
  "Jugador": "playerName",

  // Total distance
  "Total Distance": "totalDistance",
  "total distance": "totalDistance",
  "Distancia Total": "totalDistance",

  // HSR (High Speed Running)
  "High Speed Running (Relative)": "hsr",
  "high speed running (relative)": "hsr",
  "HSR": "hsr",
  "hsr": "hsr",
  "High Speed Running": "hsr",

  // Sprint distance
  "Sprint Distance": "sprintDistance",
  "sprint distance": "sprintDistance",
  "Distancia Sprint": "sprintDistance",

  // Sprints
  "Sprints": "sprints",
  "sprints": "sprints",
  "No. Of Spr": "sprints",
  "Number of Sprints": "sprints",

  // Accelerations
  "Accelerations (Relative)": "accelerations",
  "accelerations (relative)": "accelerations",
  "Accelerations": "accelerations",
  "Acc": "accelerations",

  // Decelerations
  "Decelerations (Relative)": "decelerations",
  "decelerations (relative)": "decelerations",
  "Decelerations": "decelerations",
  "Dec": "decelerations",
};

// ─── CSV Parsing ────────────────────────────────────────────────────

interface ParsedRow {
  playerName: string;
  totalDistance: number;
  hsr: number;
  sprintDistance: number;
  sprints: number;
  accelerations: number;
  decelerations: number;
}

/**
 * Parse a CSV buffer with semicolon delimiter.
 * Maps column headers using CSV_COL_MAP and normalizes values.
 */
function parseCsvBuffer(buffer: Buffer): ParsedRow[] {
  const rawRows = parse(buffer, {
    delimiter: ";",
    columns: true,        // Use first row as headers
    skip_empty_lines: true,
    trim: true,
    bom: true,            // Handle BOM from Windows-generated CSV
    relax_column_count: true,
  }) as Record<string, string>[];

  const parsed: ParsedRow[] = [];

  for (const raw of rawRows) {
    // Map CSV columns to our internal field names
    const mapped: Record<string, unknown> = {};
    for (const [csvHeader, value] of Object.entries(raw)) {
      const trimmedHeader = csvHeader.trim();
      const fieldName = CSV_COL_MAP[trimmedHeader];
      if (fieldName) {
        mapped[fieldName] = value;
      }
    }

    // Skip rows without a player name
    const rawName = String(mapped.playerName ?? "").trim();
    if (!rawName) continue;

    parsed.push({
      playerName: rawName,
      totalDistance: parseFloatSafe(mapped.totalDistance),
      hsr: parseFloatSafe(mapped.hsr),
      sprintDistance: parseFloatSafe(mapped.sprintDistance),
      sprints: parseIntSafe(mapped.sprints),
      accelerations: parseIntSafe(mapped.accelerations),
      decelerations: parseIntSafe(mapped.decelerations),
    });
  }

  return parsed;
}

// ─── Player Resolution ──────────────────────────────────────────────

/**
 * Find or create a player within a transaction.
 * Uses normalizeName() for consistent matching.
 */
async function findOrCreatePlayerTx(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  rawName: string,
): Promise<{ playerId: string; created: boolean }> {
  const name = normalizeName(rawName);
  if (!name) throw new Error(`Invalid player name: "${rawName}"`);

  const existing = await tx.player.findUnique({ where: { name } });
  if (existing) {
    return { playerId: existing.id, created: false };
  }

  const created = await tx.player.create({
    data: { name, position: "MEDIOCAMPISTA" },
  });
  return { playerId: created.id, created: true };
}

// ─── Main Upload Function ───────────────────────────────────────────

/**
 * Process a daily CSV upload (S-File) with full transactional safety.
 *
 * Flow:
 *   1. Parse CSV (semicolon-delimited)
 *   2. Within a single transaction:
 *      a. Find/create each player (normalized name)
 *      b. Determine next session_number for (playerId, date)
 *      c. Insert into gps_daily_sessions
 *      d. Recalculate gps_daily_reports (sum of all sessions)
 *      e. Recalculate weekly_stats for affected weeks
 *   3. If ANY step fails → full rollback
 */
export async function processDailyCsvUpload(
  fileBuffer: Buffer,
  reportDate: string,
): Promise<DailyCsvUploadResult> {
  // 1. Parse CSV outside transaction (pure function, no DB)
  const rows = parseCsvBuffer(fileBuffer);

  if (rows.length === 0) {
    throw new Error("EMPTY_CSV");
  }

  const date = new Date(reportDate);
  // Ensure consistent UTC midnight
  date.setUTCHours(0, 0, 0, 0);
  const { year, week } = getISOWeek(date);

  // 2. Execute everything in a single transaction
  const result = await prisma.$transaction(async (tx) => {
    const affectedPlayerIds: string[] = [];
    let playersCreated = 0;
    let sessionsCreated = 0;

    // Determine the next session number for this date.
    // All rows in one CSV file belong to the SAME session.
    const maxSession = await tx.gpsDailySession.aggregate({
      _max: { sessionNumber: true },
      where: { date },
    });
    const sessionNumber = (maxSession._max.sessionNumber ?? 0) + 1;

    // 2a. Process each row
    for (const row of rows) {
      const { playerId, created } = await findOrCreatePlayerTx(tx, row.playerName);
      if (created) playersCreated++;

      // 2b. Insert session
      await tx.gpsDailySession.create({
        data: {
          playerId,
          date,
          sessionNumber,
          year,
          weekNumber: week,
          totalDistance: row.totalDistance,
          hsr: row.hsr,
          sprintDistance: row.sprintDistance,
          sprints: row.sprints,
          accelerations: row.accelerations,
          decelerations: row.decelerations,
        },
      });

      affectedPlayerIds.push(playerId);
      sessionsCreated++;
    }

    // 2c. Recalculate daily aggregates for all affected players
    await aggregateDailySessionsBatch(tx, affectedPlayerIds, date);

    // 2d. Recalculate weekly stats for affected players
    const uniquePlayerIds = [...new Set(affectedPlayerIds)];
    for (const playerId of uniquePlayerIds) {
      await aggregateWeekForPlayer(playerId, year, week);
    }

    return {
      sessionsCreated,
      playersCreated,
      sessionNumber,
      weeksAggregated: uniquePlayerIds.length,
    };
  });

  // 3. Build response
  return {
    mode: "daily-csv",
    success: true,
    sessionsCreated: result.sessionsCreated,
    playersCreated: result.playersCreated,
    weeksAggregated: result.weeksAggregated,
    date: date.toISOString(),
    sessionNumber: result.sessionNumber,
    columns: ["playerName", "totalDistance", "hsr", "sprintDistance", "sprints", "accelerations", "decelerations"],
    preview: rows.slice(0, 5).map((r) => ({
      name: r.playerName,
      totalDistance: r.totalDistance,
      hsr: r.hsr,
      sprintDistance: r.sprintDistance,
      sprints: r.sprints,
      accelerations: r.accelerations,
      decelerations: r.decelerations,
    })),
  };
}

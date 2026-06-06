import { prisma } from "@/lib/prisma";
import { normalizeName, parseFloatSafe, parseIntSafe } from "@/lib/utils";
import { parse } from "csv-parse/sync";
import { getISOWeek, aggregateWeekForPlayer } from "@/lib/services/weekly-aggregator";
import { aggregateDailySessionsBatch } from "@/lib/services/daily-aggregator";
import { z } from "zod";

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

const CsvRowSchema = z.object({
  playerName: z.string().trim().min(1, "El nombre no puede estar vacío"),
  totalDistance: z.unknown().transform(parseFloatSafe),
  hsr: z.unknown().transform(parseFloatSafe),
  sprintDistance: z.unknown().transform(parseFloatSafe),
  sprints: z.unknown().transform(parseIntSafe),
  accelerations: z.unknown().transform(parseIntSafe),
  decelerations: z.unknown().transform(parseIntSafe),
});

type ParsedRow = z.infer<typeof CsvRowSchema>;

/**
 * Parse a CSV buffer with semicolon delimiter.
 * Maps column headers using CSV_COL_MAP and normalizes values.
 */
function parseCsvBuffer(buffer: Buffer): ParsedRow[] {
  let content = buffer.toString("utf8");
  if (content.includes("\uFFFD")) {
    content = buffer.toString("latin1");
  }

  const rawRows = parse(content, {
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

    const validation = CsvRowSchema.safeParse(mapped);

    if (validation.success) {
      parsed.push(validation.data);
    } else {
      console.warn(
        "Fila ignorada por formato inválido:",
        mapped,
        validation.error.issues
      );
    }
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

  // Parse date and force it to Noon UTC to avoid timezone shifts
  const dateStr = reportDate.includes('T') ? reportDate.split('T')[0] : reportDate;
  const date = new Date(`${dateStr}T12:00:00.000Z`);
  const { year, week } = getISOWeek(date);

  const maxSession = await prisma.gpsDailySession.aggregate({
    _max: { sessionNumber: true },
    where: { date },
  });
  const sessionNumber = (maxSession._max.sessionNumber ?? 0) + 1;

  // 1. Batch Find or Create Players
  const allNames = [...new Set(rows.map((r) => normalizeName(r.playerName)).filter(Boolean))] as string[];
  const existingPlayers = await prisma.player.findMany({
    where: { name: { in: allNames } },
  });

  const playerMap = new Map(existingPlayers.map((p) => [p.name, p.id]));
  let playersCreated = 0;

  const missingNames = allNames.filter((name) => !playerMap.has(name));
  if (missingNames.length > 0) {
    const createdPlayers = await Promise.all(
      missingNames.map((name) =>
        prisma.player.create({ data: { name, position: "MEDIOCAMPISTA" } }),
      ),
    );
    for (const p of createdPlayers) {
      playerMap.set(p.name, p.id);
      playersCreated++;
    }
  }

  // 2. Batch Insert Sessions
  const sessionData = rows.map((row) => {
    const name = normalizeName(row.playerName);
    return {
      playerId: playerMap.get(name)!,
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
    };
  }).filter((row) => row.playerId); // Safety check

  await prisma.gpsDailySession.createMany({ data: sessionData });
  const affectedPlayerIds = Array.from(playerMap.values());
  const sessionsCreated = sessionData.length;

  // 3. Batch Aggregations (concurrently)
  await aggregateDailySessionsBatch(affectedPlayerIds, date);

  const uniquePlayerIds = [...new Set(affectedPlayerIds)];
  await Promise.all(
    uniquePlayerIds.map((playerId) => aggregateWeekForPlayer(playerId, year, week)),
  );

  const result = {
    sessionsCreated,
    playersCreated,
    sessionNumber,
    weeksAggregated: uniquePlayerIds.length,
  };

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

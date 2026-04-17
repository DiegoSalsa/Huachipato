import { prisma } from "@/backend/lib/db";
import { normalizeName, parseFloatSafe, parseIntSafe } from "@/backend/lib/utils";
import * as XLSX from "xlsx";
import {
  aggregateAllAffectedWeeks,
  getISOWeek,
} from "@/backend/services/weekly-aggregator";

// ─── Types ──────────────────────────────────────────────────────────

type DailyUploadResult = {
  mode: "daily";
  success: boolean;
  imported: number;
  playersCreated: number;
  weeksAggregated: number;
  date: string;
  columns: string[];
  preview: Record<string, unknown>[];
};

type WeeklyUploadResult = {
  mode: "weekly";
  success: boolean;
  imported: number;
  playersCreated: number;
  year: number;
  weekNumber: number;
  columns: string[];
  preview: Record<string, unknown>[];
};

export type UploadResult = DailyUploadResult | WeeklyUploadResult;

// ─── Column Mapping ──────────────────────────────────────────────────

const COL_MAP: Record<string, string> = {
  // Player name
  "Player Name": "name", Nombre: "name", Name: "name",
  "player name": "name", Jugador: "name",

  // Total distance
  "Total Distance": "totalDistance", "total distance": "totalDistance",
  Dist: "totalDistance", Distancia: "totalDistance",
  "Distancia Total": "totalDistance",

  // HSR
  HSR: "hsr", hsr: "hsr",
  "High Speed Running": "hsr", "Alta Velocidad": "hsr",

  // Sprint distance
  "Sprint Distance": "sprintDistance", "sprint distance": "sprintDistance",
  "Spr Dist": "sprintDistance", "Sprint Dist": "sprintDistance",
  "Distancia Sprint": "sprintDistance",

  // Sprints
  "No. Of Spr": "sprints", Sprints: "sprints", sprints: "sprints",
  "Number of Sprints": "sprints",

  // Accelerations
  Acc: "accelerations", acc: "accelerations",
  Accelerations: "accelerations", Aceleraciones: "accelerations",

  // Decelerations
  Dec: "decelerations", dec: "decelerations",
  Decelerations: "decelerations", Desaceleraciones: "decelerations",

  // Max speed
  "Max Spd": "maxSpeed", "Max Speed": "maxSpeed",
  "max spd": "maxSpeed", "Vel Max": "maxSpeed",
  "Velocidad Maxima": "maxSpeed",

  // Weekly-specific columns
  "High Velocity": "highVelocity", "Alta Velocidad Total": "highVelocity",
  "Mechanical Impacts": "mechanicalImpacts", "Impactos Mecanicos": "mechanicalImpacts",
};

// ─── Helpers ─────────────────────────────────────────────────────────

function parseRows(rawData: Record<string, unknown>[]): Record<string, unknown>[] {
  return rawData.map((row) => {
    const normalized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      const mapped = COL_MAP[key] || COL_MAP[key.trim()];
      if (mapped) {
        normalized[mapped] = value;
      }
    }
    return normalized;
  });
}

function readSpreadsheet(buffer: Buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
}

/**
 * Read spreadsheet by COLUMN INDEX instead of header names.
 * This is critical for S-Files where headers change per week
 * (e.g. "Distancia total S19", "HSR S19").
 *
 * Index mapping:
 *   0 = Player Name
 *   1 = total_distance
 *   2 = hsr
 *   3 = sprint_distance
 *   4 = sprints
 *   5 = accelerations
 *   6 = decelerations
 */
function readSpreadsheetByIndex(buffer: Buffer): Record<string, unknown>[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // Read as array of arrays (no header mapping)
  const rawRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });

  if (rawRows.length < 2) return []; // Need at least header + 1 data row

  // Skip header row (index 0), process data rows
  const dataRows = rawRows.slice(1);

  return dataRows
    .map((cells) => {
      const arr = cells as unknown[];
      return {
        name: arr[0],
        totalDistance: arr[1],
        hsr: arr[2],
        sprintDistance: arr[3],
        sprints: arr[4],
        accelerations: arr[5],
        decelerations: arr[6],
      };
    })
    .filter((row) => {
      // Filter out rows with no player name
      const name = String(row.name ?? "").trim();
      return name.length > 0;
    });
}

async function findOrCreatePlayer(rawName: string) {
  const name = normalizeName(rawName);
  if (!name) return { player: null, created: false };

  let player = await prisma.player.findUnique({ where: { name } });
  if (!player) {
    player = await prisma.player.create({
      data: { name, position: "MEDIOCAMPISTA" },
    });
    return { player, created: true };
  }
  // Player already exists — do NOT overwrite position
  return { player, created: false };
}

// ─── Daily Upload ────────────────────────────────────────────────────

export async function processDailyUpload(
  file: File,
  reportDate: string,
): Promise<DailyUploadResult> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const rawData = readSpreadsheet(buffer);

  if (rawData.length === 0) throw new Error("EMPTY_SPREADSHEET");

  const rows = parseRows(rawData);
  const date = new Date(reportDate);
  const { year, week } = getISOWeek(date);

  let imported = 0;
  let playersCreated = 0;
  const allPlayerIds: string[] = [];

  for (const row of rows) {
    const rawName = String(row.name || "");
    if (!rawName.trim()) continue;

    const { player, created } = await findOrCreatePlayer(rawName);
    if (!player) continue;
    if (created) playersCreated++;

    await prisma.gpsDailyReport.upsert({
      where: {
        playerId_date: { playerId: player.id, date },
      },
      update: {
        year,
        weekNumber: week,
        totalDistance: parseFloatSafe(row.totalDistance),
        hsr: parseFloatSafe(row.hsr),
        sprintDistance: parseFloatSafe(row.sprintDistance),
        sprints: parseIntSafe(row.sprints),
        accelerations: parseIntSafe(row.accelerations),
        decelerations: parseIntSafe(row.decelerations),
        maxSpeed: parseFloatSafe(row.maxSpeed),
      },
      create: {
        playerId: player.id,
        date,
        year,
        weekNumber: week,
        totalDistance: parseFloatSafe(row.totalDistance),
        hsr: parseFloatSafe(row.hsr),
        sprintDistance: parseFloatSafe(row.sprintDistance),
        sprints: parseIntSafe(row.sprints),
        accelerations: parseIntSafe(row.accelerations),
        decelerations: parseIntSafe(row.decelerations),
        maxSpeed: parseFloatSafe(row.maxSpeed),
      },
    });

    allPlayerIds.push(player.id);
    imported++;
  }

  // Recalculate weekly stats for affected players
  const uniquePlayerIds = [...new Set(allPlayerIds)];
  const aggregated = await aggregateAllAffectedWeeks(uniquePlayerIds, [date]);

  return {
    mode: "daily",
    success: true,
    imported,
    playersCreated,
    weeksAggregated: aggregated.length,
    date: date.toISOString(),
    columns: Object.keys(rows[0] || {}),
    preview: rows.slice(0, 5),
  };
}

// ─── Weekly Upload (Historical / S-Files) ────────────────────────────
//
// S-Files have headers that change per week (e.g. "Distancia total S19",
// "HSR S19"). We IGNORE header names entirely and parse by column index:
//
//   Index 0 (Col A) = Player Name
//   Index 1 (Col B) = total_distance
//   Index 2 (Col C) = hsr
//   Index 3 (Col D) = sprint_distance
//   Index 4 (Col E) = sprints
//   Index 5 (Col F) = accelerations
//   Index 6 (Col G) = decelerations
//
// Aggregation:
//   high_velocity     = col2 + col3
//   mechanical_impacts = col4 + col5 + col6

export async function processWeeklyUpload(
  file: File,
  year: number,
  weekNumber: number,
): Promise<WeeklyUploadResult> {
  const buffer = Buffer.from(await file.arrayBuffer());

  // Use INDEX-BASED parsing — ignores all header text
  const rows = readSpreadsheetByIndex(buffer);

  if (rows.length === 0) throw new Error("EMPTY_SPREADSHEET");

  let imported = 0;
  let playersCreated = 0;
  const previewRows: Record<string, unknown>[] = [];

  for (const row of rows) {
    const rawName = String(row.name ?? "").trim();
    if (!rawName) continue;

    // Parse all numeric columns with cleaning (handles "35.421" thousands, empty cells, etc.)
    const totalDistance = parseFloatSafe(row.totalDistance);  // Index 1
    const hsr = parseFloatSafe(row.hsr);                      // Index 2
    const sprintDistance = parseFloatSafe(row.sprintDistance); // Index 3
    const sprints = parseIntSafe(row.sprints);                 // Index 4
    const accelerations = parseIntSafe(row.accelerations);     // Index 5
    const decelerations = parseIntSafe(row.decelerations);     // Index 6

    // Aggregation formulas
    const highVelocity = hsr + sprintDistance;
    const mechanicalImpacts = sprints + accelerations + decelerations;

    // Skip rows where ALL metrics are 0 (completely empty row like Cris Martínez S19)
    if (totalDistance === 0 && highVelocity === 0 && mechanicalImpacts === 0) {
      continue;
    }

    const { player, created } = await findOrCreatePlayer(rawName);
    if (!player) continue;
    if (created) playersCreated++;

    // Upsert into weekly_stats using the MANUAL year/week from the user
    await prisma.weeklyStat.upsert({
      where: {
        playerId_year_weekNumber: {
          playerId: player.id,
          year,
          weekNumber,
        },
      },
      update: { totalDistance, highVelocity, mechanicalImpacts },
      create: {
        playerId: player.id,
        year,
        weekNumber,
        totalDistance,
        highVelocity,
        mechanicalImpacts,
      },
    });

    imported++;

    // Build preview
    if (previewRows.length < 5) {
      previewRows.push({
        name: rawName,
        totalDistance,
        hsr,
        sprintDistance,
        sprints,
        accelerations,
        decelerations,
        highVelocity,
        mechanicalImpacts,
      });
    }
  }

  return {
    mode: "weekly",
    success: true,
    imported,
    playersCreated,
    year,
    weekNumber,
    columns: ["name", "totalDistance", "hsr", "sprintDistance", "sprints", "accelerations", "decelerations"],
    preview: previewRows,
  };
}

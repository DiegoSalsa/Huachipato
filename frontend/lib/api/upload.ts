import { prisma } from "@/lib/prisma";
import { normalizeName, parseFloatSafe, parseIntSafe } from "@/lib/utils";
import * as XLSX from "xlsx";
import { parse } from "csv-parse/sync";
import {
  aggregateAllAffectedWeeks,
  aggregateWeekForPlayer,
  getISOWeek,
} from "@/lib/services/weekly-aggregator";
import { aggregateDailySessionsBatch } from "@/lib/services/daily-aggregator";

// ─── Types ──────────────────────────────────────────────────────────

type DailyUploadResult = {
  mode: "daily";
  success: boolean;
  imported: number;
  playersCreated: number;
  weeksAggregated: number;
  sessionNumber: number;
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

// ─── Unified Column Mapping ─────────────────────────────────────────
// Used for BOTH Excel header mapping and CSV header mapping.

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
  "High Speed Running (Relative)": "hsr",
  "high speed running (relative)": "hsr",

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
  "Accelerations (Relative)": "accelerations",
  "accelerations (relative)": "accelerations",

  // Decelerations
  Dec: "decelerations", dec: "decelerations",
  Decelerations: "decelerations", Desaceleraciones: "decelerations",
  "Decelerations (Relative)": "decelerations",
  "decelerations (relative)": "decelerations",

  // Max speed
  "Max Spd": "maxSpeed", "Max Speed": "maxSpeed",
  "max spd": "maxSpeed", "Vel Max": "maxSpeed",
  "Velocidad Maxima": "maxSpeed",

  // Weekly-specific columns
  "High Velocity": "highVelocity", "Alta Velocidad Total": "highVelocity",
  "Mechanical Impacts": "mechanicalImpacts", "Impactos Mecanicos": "mechanicalImpacts",
};

// ─── Helpers ─────────────────────────────────────────────────────────

interface ParsedDailyRow {
  name: string;
  totalDistance: number;
  hsr: number;
  sprintDistance: number;
  sprints: number;
  accelerations: number;
  decelerations: number;
}

/**
 * Detect if a buffer is a CSV file (semicolon-delimited text)
 * by checking the first bytes for text patterns.
 */
function isCsvFile(buffer: Buffer, fileName?: string): boolean {
  // Check file extension first
  if (fileName) {
    const ext = fileName.toLowerCase().split(".").pop();
    if (ext === "csv") return true;
    if (ext === "xlsx" || ext === "xls") return false;
  }

  // Fallback: sniff content — CSV files start with text, Excel starts with PK or binary
  const header = buffer.subarray(0, 4);
  // XLSX files start with PK (zip signature: 0x504B)
  if (header[0] === 0x50 && header[1] === 0x4B) return false;
  // XLS files start with D0 CF 11 E0 (OLE2)
  if (header[0] === 0xD0 && header[1] === 0xCF) return false;
  // Otherwise assume CSV
  return true;
}

/**
 * Parse a CSV buffer (semicolon-delimited) and map to daily rows.
 */
function parseCsvRows(buffer: Buffer): ParsedDailyRow[] {
  const rawRows = parse(buffer, {
    delimiter: ";",
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
    relax_column_count: true,
  }) as Record<string, string>[];

  const parsed: ParsedDailyRow[] = [];

  for (const raw of rawRows) {
    const mapped: Record<string, unknown> = {};
    for (const [csvHeader, value] of Object.entries(raw)) {
      const trimmedHeader = csvHeader.trim();
      const fieldName = COL_MAP[trimmedHeader];
      if (fieldName) {
        mapped[fieldName] = value;
      }
    }

    const rawName = String(mapped.name ?? "").trim();
    if (!rawName) continue;

    parsed.push({
      name: rawName,
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

/**
 * Parse an Excel buffer and map to daily rows.
 */
function parseExcelRows(buffer: Buffer): ParsedDailyRow[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

  const parsed: ParsedDailyRow[] = [];

  for (const raw of rawData) {
    const mapped: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(raw)) {
      const fieldName = COL_MAP[key] || COL_MAP[key.trim()];
      if (fieldName) {
        mapped[fieldName] = value;
      }
    }

    const rawName = String(mapped.name ?? "").trim();
    if (!rawName) continue;

    parsed.push({
      name: rawName,
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

function readSpreadsheetByIndex(buffer: Buffer): Record<string, unknown>[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });
  if (rawRows.length < 2) return [];
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
      const name = String(row.name ?? "").trim();
      return name.length > 0;
    });
}

// ─── Player helpers ──────────────────────────────────────────────────

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
  return { player, created: false };
}

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

// ─── Daily Upload (Unified: CSV + Excel) ─────────────────────────────
//
// Auto-detects file format (CSV or Excel), parses rows, and persists
// through the session-based transactional flow:
//
//   file → parse → gps_daily_sessions → aggregate → gps_daily_reports → weekly_stats
//
// Supports multiple sessions per day (AM/PM double sessions).

export async function processDailyUpload(
  file: File,
  reportDate: string,
): Promise<DailyUploadResult> {
  const buffer = Buffer.from(await file.arrayBuffer());

  // Auto-detect format and parse
  const csv = isCsvFile(buffer, file.name);
  const rows = csv ? parseCsvRows(buffer) : parseExcelRows(buffer);

  if (rows.length === 0) throw new Error("EMPTY_SPREADSHEET");

  const date = new Date(reportDate);
  date.setUTCHours(0, 0, 0, 0);
  const { year, week } = getISOWeek(date);

  // Execute everything in a single transaction with rollback on failure
  const result = await prisma.$transaction(async (tx) => {
    const affectedPlayerIds: string[] = [];
    let playersCreated = 0;

    // ── Consolidate duplicate player names within the same file ──
    // Some CSVs have the same player on multiple rows (e.g. half 1 + half 2).
    // Sum their metrics into a single row per player before inserting.
    const consolidated = new Map<string, ParsedDailyRow>();
    for (const row of rows) {
      const key = normalizeName(row.name);
      if (!key) continue;
      const existing = consolidated.get(key);
      if (existing) {
        existing.totalDistance += row.totalDistance;
        existing.hsr += row.hsr;
        existing.sprintDistance += row.sprintDistance;
        existing.sprints += row.sprints;
        existing.accelerations += row.accelerations;
        existing.decelerations += row.decelerations;
      } else {
        consolidated.set(key, { ...row });
      }
    }

    const uniqueRows = Array.from(consolidated.values());

    // Determine the next session number for this date
    // All rows in one file belong to the SAME session
    const maxSession = await tx.gpsDailySession.aggregate({
      _max: { sessionNumber: true },
      where: { date },
    });
    const sessionNumber = (maxSession._max.sessionNumber ?? 0) + 1;

    // Process each consolidated row
    for (const row of uniqueRows) {
      const { playerId, created } = await findOrCreatePlayerTx(tx, row.name);
      if (created) playersCreated++;

      // Insert into sessions table
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
    }

    // Recalculate daily aggregates (sum all sessions → gps_daily_reports)
    await aggregateDailySessionsBatch(tx, affectedPlayerIds, date);

    // Recalculate weekly stats for affected players
    const uniquePlayerIds = [...new Set(affectedPlayerIds)];
    for (const playerId of uniquePlayerIds) {
      await aggregateWeekForPlayer(playerId, year, week, tx);
    }

    return {
      imported: uniqueRows.length,
      playersCreated,
      sessionNumber,
      weeksAggregated: uniquePlayerIds.length,
    };
  });

  return {
    mode: "daily",
    success: true,
    imported: result.imported,
    playersCreated: result.playersCreated,
    weeksAggregated: result.weeksAggregated,
    sessionNumber: result.sessionNumber,
    date: date.toISOString(),
    columns: Object.keys(rows[0] || {}),
    preview: rows.slice(0, 5).map((r) => ({
      name: r.name,
      totalDistance: r.totalDistance,
      hsr: r.hsr,
      sprintDistance: r.sprintDistance,
      sprints: r.sprints,
      accelerations: r.accelerations,
      decelerations: r.decelerations,
    })),
  };
}

// ─── Weekly Upload (Historical / S-Files) ────────────────────────────

export async function processWeeklyUpload(
  file: File,
  year: number,
  weekNumber: number,
): Promise<WeeklyUploadResult> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const rows = readSpreadsheetByIndex(buffer);

  if (rows.length === 0) throw new Error("EMPTY_SPREADSHEET");

  let imported = 0;
  let playersCreated = 0;
  const previewRows: Record<string, unknown>[] = [];

  for (const row of rows) {
    const rawName = String(row.name ?? "").trim();
    if (!rawName) continue;

    const totalDistance = parseFloatSafe(row.totalDistance);
    const hsr = parseFloatSafe(row.hsr);
    const sprintDistance = parseFloatSafe(row.sprintDistance);
    const sprints = parseIntSafe(row.sprints);
    const accelerations = parseIntSafe(row.accelerations);
    const decelerations = parseIntSafe(row.decelerations);

    const highVelocity = hsr + sprintDistance;
    const mechanicalImpacts = sprints + accelerations + decelerations;

    if (totalDistance === 0 && highVelocity === 0 && mechanicalImpacts === 0) {
      continue;
    }

    const { player, created } = await findOrCreatePlayer(rawName);
    if (!player) continue;
    if (created) playersCreated++;

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

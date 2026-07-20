import { prisma } from "@/lib/prisma";
import { normalizeName, parseFloatSafe, parseIntSafe } from "@/lib/utils";
import type { Prisma } from "@prisma/client";
import * as XLSX from "xlsx";
import { parse } from "csv-parse/sync";
import {
  aggregateWeekForPlayer,
  getISOWeek,
} from "@/lib/services/weekly-aggregator";
import { aggregateDailySessionsBatch } from "@/lib/services/daily-aggregator";
import type { Squad } from "@/lib/squads";

// Tipos

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

// Mapeo unificado de columnas
// Se usa para mapear columnas de Excel y CSV.

const COL_MAP: Record<string, string> = {
  // Nombre del jugador
  "Player Name": "name", Nombre: "name", Name: "name",
  "player name": "name", Jugador: "name",

  // Distancia total
  "Total Distance": "totalDistance", "total distance": "totalDistance",
  Dist: "totalDistance", Distancia: "totalDistance",
  "Distancia Total": "totalDistance",

  // HSR
  HSR: "hsr", hsr: "hsr",
  "High Speed Running": "hsr", "Alta Velocidad": "hsr",
  "High Speed Running (Relative)": "hsr",
  "high speed running (relative)": "hsr",

  // Distancia en sprint
  "Sprint Distance": "sprintDistance", "sprint distance": "sprintDistance",
  "Spr Dist": "sprintDistance", "Sprint Dist": "sprintDistance",
  "Distancia Sprint": "sprintDistance",

  // Sprints
  "No. Of Spr": "sprints", Sprints: "sprints", sprints: "sprints",
  "Number of Sprints": "sprints",

  // Aceleraciones
  Acc: "accelerations", acc: "accelerations",
  Accelerations: "accelerations", Aceleraciones: "accelerations",
  "Accelerations (Relative)": "accelerations",
  "accelerations (relative)": "accelerations",

  // Desaceleraciones
  Dec: "decelerations", dec: "decelerations",
  Decelerations: "decelerations", Desaceleraciones: "decelerations",
  "Decelerations (Relative)": "decelerations",
  "decelerations (relative)": "decelerations",

  // Velocidad maxima
  "Max Spd": "maxSpeed", "Max Speed": "maxSpeed",
  "max spd": "maxSpeed", "Vel Max": "maxSpeed",
  "Velocidad Maxima": "maxSpeed",

  // Columnas semanales
  "High Velocity": "highVelocity", "Alta Velocidad Total": "highVelocity",
  "Mechanical Impacts": "mechanicalImpacts", "Impactos Mecanicos": "mechanicalImpacts",
};

// Funciones auxiliares

interface ParsedDailyRow {
  name: string;
  totalDistance: number;
  hsr: number;
  sprintDistance: number;
  sprints: number;
  accelerations: number;
  decelerations: number;
}

//
// Detecta si el archivo corresponde a CSV o Excel.
// Se revisa la extension y, si es necesario, la firma inicial del archivo.
//
function isCsvFile(buffer: Buffer, fileName?: string): boolean {
  // Revisar primero la extension del archivo
  if (fileName) {
    const ext = fileName.toLowerCase().split(".").pop();
    if (ext === "csv") return true;
    if (ext === "xlsx" || ext === "xls") return false;
  }

  // Si no hay extension, revisar el contenido - los CSV comienzan como texto y Excel usa firma binaria
  const header = buffer.subarray(0, 4);
  // Los archivos XLSX comienzan con firma PK
  if (header[0] === 0x50 && header[1] === 0x4B) return false;
  // Los archivos XLS comienzan con firma OLE2
  if (header[0] === 0xD0 && header[1] === 0xCF) return false;
  // Si no coincide con Excel, asumir CSV
  return true;
}

//
// Lee un archivo CSV separado por punto y coma y lo transforma a filas diarias.
//
function parseCsvRows(buffer: Buffer): ParsedDailyRow[] {
  let content = buffer.toString("utf8");
  if (content.includes("\uFFFD")) {
    content = buffer.toString("latin1");
  }

  const rawRows = parse(content, {
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

//
// Lee un archivo Excel y lo transforma a filas diarias.
//
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

// Funciones de jugadores

async function findOrCreatePlayer(rawName: string, squad: Squad) {
  const name = normalizeName(rawName);
  if (!name) return { player: null, created: false };

  let player = await prisma.player.findUnique({ where: { squad_name: { squad, name } } });
  if (!player) {
    player = await prisma.player.create({
      data: { name, position: "MEDIOCAMPISTA", squad },
    });
    return { player, created: true };
  }
  return { player, created: false };
}

// Carga diaria unificada CSV y Excel
//
// Detecta automaticamente el formato del archivo CSV o Excel, lee filas y guarda los datos
// mediante el flujo transaccional por sesiones:
//
//   archivo -> lectura -> sesiones GPS -> agregados diarios -> estadisticas semanales
//
// Permite multiples sesiones por dia por ejemplo manana y tarde.

export async function processDailyUpload(
  file: File,
  reportDate: string,
  squad: Squad,
): Promise<DailyUploadResult> {
  const buffer = Buffer.from(await file.arrayBuffer());

  // Detectar formato y leer filas
  const csv = isCsvFile(buffer, file.name);
  const rows = csv ? parseCsvRows(buffer) : parseExcelRows(buffer);

  if (rows.length === 0) throw new Error("EMPTY_SPREADSHEET");

  // Fijar la fecha al mediodia UTC para evitar desfases horarios
  const dateStr = reportDate.includes('T') ? reportDate.split('T')[0] : reportDate;
  const date = new Date(`${dateStr}T12:00:00.000Z`);
  const { year, week } = getISOWeek(date);

  // Consolidate duplicate player names within the same file
  // Algunos CSV repiten jugadores en varias filas (por ejemplo half 1 + half 2).
  // Suma sus metricas en una sola fila por jugador antes de insertar.
  const consolidated = new Map<string, ParsedDailyRow>();
  for (const row of rows) {
    const normalized = normalizeName(row.name);
    if (!normalized) continue;
    const existing = consolidated.get(normalized);
    if (existing) {
      existing.totalDistance += row.totalDistance;
      existing.hsr += row.hsr;
      existing.sprintDistance += row.sprintDistance;
      existing.sprints += row.sprints;
      existing.accelerations += row.accelerations;
      existing.decelerations += row.decelerations;
    } else {
      consolidated.set(normalized, { ...row, name: normalized });
    }
  }

  const uniqueRows = Array.from(consolidated.values());

  const maxSession = await prisma.gpsDailySession.aggregate({
    _max: { sessionNumber: true },
    where: { date, player: { squad } },
  });
  const sessionNumber = (maxSession._max.sessionNumber ?? 0) + 1;

  // 1. Buscar o crear jugadores por lote
  const allNames = uniqueRows.map((r) => r.name);
  const existingPlayers = await prisma.player.findMany({
    where: { squad, name: { in: allNames } },
  });

  const playerMap = new Map<string, string>(existingPlayers.map((p) => [p.name, p.id]));
  let playersCreated = 0;

  const missingNames = allNames.filter((name) => !playerMap.has(name));
  if (missingNames.length > 0) {
    const createdPlayers = await Promise.all(
      missingNames.map((name) =>
        prisma.player.create({ data: { name, position: "MEDIOCAMPISTA", squad } }),
      ),
    );
    for (const p of createdPlayers) {
      playerMap.set(p.name, p.id);
      playersCreated++;
    }
  }

  // 2. Insertar sesiones por lote
  const sessionData: Prisma.GpsDailySessionCreateManyInput[] = uniqueRows.map((row) => ({
    playerId: playerMap.get(row.name)!,
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
  }));

  await prisma.gpsDailySession.createMany({ data: sessionData });
  const affectedPlayerIds: string[] = Array.from(playerMap.values());

  // 3. Recalcular agregados por lote
  // Recalcular agregados diarios en paralelo
  await aggregateDailySessionsBatch(affectedPlayerIds, date);

  // Recalcular estadisticas semanales en paralelo
  const uniquePlayerIds = [...new Set(affectedPlayerIds)];
  await Promise.all(
    uniquePlayerIds.map((playerId) => aggregateWeekForPlayer(playerId, year, week)),
  );

  const result = {
    imported: uniqueRows.length,
    playersCreated,
    sessionNumber,
    weeksAggregated: uniquePlayerIds.length,
  };

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

// Carga semanal historica

export async function processWeeklyUpload(
  file: File,
  year: number,
  weekNumber: number,
  squad: Squad,
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

    const { player, created } = await findOrCreatePlayer(rawName, squad);
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

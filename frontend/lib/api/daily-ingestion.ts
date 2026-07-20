import { prisma } from "@/lib/prisma";
import { normalizeName, parseFloatSafe, parseIntSafe } from "@/lib/utils";
import { parse } from "csv-parse/sync";
import { getISOWeek, aggregateWeekForPlayer } from "@/lib/services/weekly-aggregator";
import { aggregateDailySessionsBatch } from "@/lib/services/daily-aggregator";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import type { Squad } from "@/lib/squads";

// Tipos

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

// Mapeo de columnas CSV
//
// Los archivos S-File usan punto y coma como separador.
// Se aceptan nombres de columnas habituales de los dispositivos GPS.

const CSV_COL_MAP: Record<string, string> = {
  // Nombre del jugador
  "Player Name": "playerName",
  "player name": "playerName",
  "Nombre": "playerName",
  "Name": "playerName",
  "Jugador": "playerName",

  // Distancia total
  "Total Distance": "totalDistance",
  "total distance": "totalDistance",
  "Distancia Total": "totalDistance",

  // HSR (High Speed Running)
  "High Speed Running (Relative)": "hsr",
  "high speed running (relative)": "hsr",
  "HSR": "hsr",
  "hsr": "hsr",
  "High Speed Running": "hsr",

  // Distancia en sprint
  "Sprint Distance": "sprintDistance",
  "sprint distance": "sprintDistance",
  "Distancia Sprint": "sprintDistance",

  // Sprints
  "Sprints": "sprints",
  "sprints": "sprints",
  "No. Of Spr": "sprints",
  "Number of Sprints": "sprints",

  // Aceleraciones
  "Accelerations (Relative)": "accelerations",
  "accelerations (relative)": "accelerations",
  "Accelerations": "accelerations",
  "Aceleraciones": "accelerations",
  "Acc": "accelerations",

  // Desaceleraciones
  "Decelerations (Relative)": "decelerations",
  "decelerations (relative)": "decelerations",
  "Decelerations": "decelerations",
  "Desaceleraciones": "decelerations",
  "Dec": "decelerations",
};

// Lectura de CSV

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

//
// Lee un CSV separado por punto y coma.
// Mapea encabezados con CSV_COL_MAP y normaliza valores.
//
function parseCsvBuffer(buffer: Buffer): ParsedRow[] {
  let content = buffer.toString("utf8");
  if (content.includes("\uFFFD")) {
    content = buffer.toString("latin1");
  }

  const rawRows = parse(content, {
    delimiter: ";",
    columns: true,        // Usar primera fila como encabezados
    skip_empty_lines: true,
    trim: true,
    bom: true,            // Manejar BOM en archivos CSV generados en Windows
    relax_column_count: true,
  }) as Record<string, string>[];

  const parsed: ParsedRow[] = [];

  for (const raw of rawRows) {
    // Mapear columnas CSV a nombres internos
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

// Funcion principal de carga

//
// Procesa una carga CSV diaria con seguridad transaccional.
//
// Flujo:
//   1. Leer CSV separado por punto y coma
//   2. Dentro de una misma transaccion:
//      a. Buscar o crear cada jugador con nombre normalizado
//      b. Determinar el siguiente numero de sesion para la fecha
//      c. Insertar registros en gps_daily_sessions
//      d. Recalcular gps_daily_reports como suma de sesiones
//      e. Recalcular weekly_stats para las semanas afectadas
//   3. Si falla cualquier paso -> se revierte todo
//
export async function processDailyCsvUpload(
  fileBuffer: Buffer,
  reportDate: string,
  squad: Squad,
): Promise<DailyCsvUploadResult> {
  // Leer CSV fuera de la transaccion.
  const rows = parseCsvBuffer(fileBuffer);

  if (rows.length === 0) {
    throw new Error("EMPTY_CSV");
  }

  // Fijar la fecha al mediodia UTC para evitar desfases horarios
  const dateStr = reportDate.includes('T') ? reportDate.split('T')[0] : reportDate;
  const date = new Date(`${dateStr}T12:00:00.000Z`);
  const { year, week } = getISOWeek(date);

  const maxSession = await prisma.gpsDailySession.aggregate({
    _max: { sessionNumber: true },
    where: { date, player: { squad } },
  });
  const sessionNumber = (maxSession._max.sessionNumber ?? 0) + 1;

  // 1. Buscar o crear jugadores por lote
  const allNames = [...new Set(rows.map((r) => normalizeName(r.playerName)).filter(Boolean))] as string[];
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
  const sessionData: Prisma.GpsDailySessionCreateManyInput[] = rows.flatMap((row) => {
    const name = normalizeName(row.playerName);
    const playerId = playerMap.get(name);
    if (!playerId) return [];

    return {
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
    };
  });

  await prisma.gpsDailySession.createMany({ data: sessionData });
  const affectedPlayerIds: string[] = Array.from(playerMap.values());
  const sessionsCreated = sessionData.length;

  // 3. Recalcular agregados por lote en paralelo
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

  // 3. Construir respuesta
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

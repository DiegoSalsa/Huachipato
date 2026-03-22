import { prisma } from "@/backend/lib/db";
import * as XLSX from "xlsx";

type UploadResult = {
  success: boolean;
  sessionId: number;
  segmentId: number | null;
  imported: number;
  columns: string[];
  preview: Record<string, unknown>[];
};

const COL_MAP: Record<string, string> = {
  "Player Name": "name",
  Nombre: "name",
  Name: "name",
  "player name": "name",
  "Total Distance": "totalDistance",
  Dist: "totalDistance",
  "total distance": "totalDistance",
  "D/Min": "dMin",
  "Distance Per Min": "dMin",
  "d/min": "dMin",
  "Max Spd": "maxSpeed",
  "Max Speed": "maxSpeed",
  "max spd": "maxSpeed",
  HSR: "hsr",
  "High Speed Running": "hsr",
  hsr: "hsr",
  "Dist Z5": "distZ5",
  "Z5 Distance": "distZ5",
  "dist z5": "distZ5",
  "Dist Z6": "distZ6",
  "Z6 Distance": "distZ6",
  "dist z6": "distZ6",
  "No. Of Spr": "sprintCount",
  "Number of Sprints": "sprintCount",
  Sprints: "sprintCount",
  "Spr Dist": "sprintDist",
  "Sprint Distance": "sprintDist",
  Acc: "acc",
  Accelerations: "acc",
  acc: "acc",
  Dec: "dec",
  Decelerations: "dec",
  dec: "dec",
};

function parseIntSafe(value: unknown) {
  const parsed = parseInt(String(value ?? 0), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseFloatSafe(value: unknown) {
  const parsed = parseFloat(String(value ?? 0));
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function processUpload(file: File, sessionDate: string | null, segment: string | null): Promise<UploadResult> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

  if (rawData.length === 0) {
    throw new Error("EMPTY_SPREADSHEET");
  }

  const rows = rawData.map((row) => {
    const normalized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(row)) {
      const mapped = COL_MAP[key] || COL_MAP[key.trim()];
      if (mapped) {
        normalized[mapped] = value;
      }
    }

    return normalized;
  });

  const segmentName = segment || "Sesion Completa";
  const date = sessionDate ? new Date(sessionDate) : new Date();
  const dayStart = new Date(date.toDateString());
  const dayEnd = new Date(dayStart.getTime() + 86400000);

  let session = await prisma.session.findFirst({
    where: {
      date: {
        gte: dayStart,
        lt: dayEnd,
      },
    },
    include: { segments: true },
  });

  if (!session) {
    session = await prisma.session.create({
      data: {
        date,
        startTime: "00:00:00",
        endTime: "00:00:00",
        duration: "00:00:00",
        totalPlayers: rows.length,
        fileName: file.name,
      },
      include: { segments: true },
    });
  }

  let segmentId: number | null = null;

  if (segmentName !== "Sesion Completa" && segmentName !== "Sesión Completa") {
    let sessionSegment = session.segments.find((item) => item.name === segmentName);

    if (!sessionSegment) {
      sessionSegment = await prisma.segment.create({
        data: {
          sessionId: session.id,
          name: segmentName,
          startTime: "00:00:00",
          endTime: "00:00:00",
          duration: "00:00:00",
        },
      });
    }

    segmentId = sessionSegment.id;
  }

  let imported = 0;

  for (const row of rows) {
    const name = String(row.name || "").trim();
    if (!name) {
      continue;
    }

    let player = await prisma.player.findFirst({ where: { name } });
    if (!player) {
      player = await prisma.player.create({
        data: {
          name,
          position: "",
          category: "Sub-17",
        },
      });
    }

    await prisma.playerMetric.create({
      data: {
        playerId: player.id,
        sessionId: session.id,
        segmentId,
        totalDistance: parseIntSafe(row.totalDistance),
        dMin: parseIntSafe(row.dMin),
        maxSpeed: parseFloatSafe(row.maxSpeed),
        hsr: parseIntSafe(row.hsr),
        distZ5: parseIntSafe(row.distZ5),
        distZ6: parseIntSafe(row.distZ6),
        sprintCount: parseIntSafe(row.sprintCount),
        sprintDist: parseIntSafe(row.sprintDist),
        acc: parseIntSafe(row.acc),
        dec: parseIntSafe(row.dec),
      },
    });

    imported += 1;
  }

  return {
    success: true,
    sessionId: session.id,
    segmentId,
    imported,
    columns: Object.keys(rows[0] || {}),
    preview: rows.slice(0, 5),
  };
}

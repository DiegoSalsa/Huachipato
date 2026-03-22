import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const sessionDate = formData.get("date") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Read the file buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

    if (rawData.length === 0) {
      return NextResponse.json({ error: "Empty spreadsheet" }, { status: 400 });
    }

    // Map column names (flexible — supports both English STATSports and Spanish labels)
    const colMap: Record<string, string> = {
      "Player Name": "name", "Nombre": "name", "Name": "name", "player name": "name",
      "Total Distance": "totalDistance", "Dist": "totalDistance", "total distance": "totalDistance",
      "D/Min": "dMin", "Distance Per Min": "dMin", "d/min": "dMin",
      "Max Spd": "maxSpeed", "Max Speed": "maxSpeed", "max spd": "maxSpeed",
      "HSR": "hsr", "High Speed Running": "hsr", "hsr": "hsr",
      "Dist Z5": "distZ5", "Z5 Distance": "distZ5", "dist z5": "distZ5",
      "Dist Z6": "distZ6", "Z6 Distance": "distZ6", "dist z6": "distZ6",
      "No. Of Spr": "sprintCount", "Number of Sprints": "sprintCount", "Sprints": "sprintCount",
      "Spr Dist": "sprintDist", "Sprint Distance": "sprintDist",
      "Acc": "acc", "Accelerations": "acc", "acc": "acc",
      "Dec": "dec", "Decelerations": "dec", "dec": "dec",
    };

    // Normalize rows
    const rows = rawData.map((row) => {
      const normalized: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(row)) {
        const mapped = colMap[key] || colMap[key.trim()];
        if (mapped) normalized[mapped] = value;
      }
      return normalized;
    });

    // Detect segment name from sheet or formData
    const segmentName = (formData.get("segment") as string) || "Sesión Completa";

    // Create session if date provided
    const date = sessionDate ? new Date(sessionDate) : new Date();
    let session = await prisma.session.findFirst({
      where: { date: { gte: new Date(date.toDateString()), lt: new Date(new Date(date.toDateString()).getTime() + 86400000) } },
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

    // Create segment if needed
    let segmentId: number | null = null;
    if (segmentName !== "Sesión Completa") {
      let segment = session.segments.find((s) => s.name === segmentName);
      if (!segment) {
        segment = await prisma.segment.create({
          data: {
            sessionId: session.id,
            name: segmentName,
            startTime: "00:00:00",
            endTime: "00:00:00",
            duration: "00:00:00",
          },
        });
      }
      segmentId = segment.id;
    }

    // Upsert players and create metrics
    let imported = 0;
    for (const row of rows) {
      const name = String(row.name || "").trim();
      if (!name) continue;

      // Find or create player
      let player = await prisma.player.findFirst({ where: { name } });
      if (!player) {
        player = await prisma.player.create({
          data: { name, position: "", category: "Sub-17" },
        });
      }

      // Create metric
      await prisma.playerMetric.create({
        data: {
          playerId: player.id,
          sessionId: session.id,
          segmentId,
          totalDistance: parseInt(String(row.totalDistance || 0), 10),
          dMin: parseInt(String(row.dMin || 0), 10),
          maxSpeed: parseFloat(String(row.maxSpeed || 0)),
          hsr: parseInt(String(row.hsr || 0), 10),
          distZ5: parseInt(String(row.distZ5 || 0), 10),
          distZ6: parseInt(String(row.distZ6 || 0), 10),
          sprintCount: parseInt(String(row.sprintCount || 0), 10),
          sprintDist: parseInt(String(row.sprintDist || 0), 10),
          acc: parseInt(String(row.acc || 0), 10),
          dec: parseInt(String(row.dec || 0), 10),
        },
      });
      imported++;
    }

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      segmentId,
      imported,
      columns: Object.keys(rows[0] || {}),
      preview: rows.slice(0, 5),
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Failed to process file" }, { status: 500 });
  }
}

import { createMedicalRecord, listMedicalRecords } from "@/backend/api/medical";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const playerId = searchParams.get("playerId");

  const records = await listMedicalRecords(playerId ? parseInt(playerId, 10) : undefined);

  return NextResponse.json(records);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { playerId, date, weight, height, fatPct, musclePct, jumpCMJ, sprint10m, status, notes } = body;

    if (!playerId || !date) {
      return NextResponse.json({ error: "playerId and date are required" }, { status: 400 });
    }

    const record = await createMedicalRecord({
      playerId,
      date,
      weight,
      height,
      fatPct,
      musclePct,
      jumpCMJ,
      sprint10m,
      status,
      notes,
    });

    return NextResponse.json(record, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "INVALID_PLAYER_ID") {
      return NextResponse.json({ error: "Invalid player ID" }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to create medical record" }, { status: 500 });
  }
}

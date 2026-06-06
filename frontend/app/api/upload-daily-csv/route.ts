import { processDailyCsvUpload } from "@/lib/api/daily-ingestion";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/upload-daily-csv
 *
 * Receives a CSV S-File (semicolon-delimited) from GPS devices
 * along with a date, and processes it into:
 *   gps_daily_sessions → gps_daily_reports → weekly_stats
 *
 * Body (multipart/form-data):
 *   - file: File  (required) — The CSV file
 *   - date: string (required) — ISO date string e.g. "2026-05-20"
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const dateStr = formData.get("date") as string | null;

    // ─── Validation ───────────────────────────────────────────
    if (!file) {
      return NextResponse.json(
        { error: "No se proporcionó un archivo" },
        { status: 400 },
      );
    }

    if (!dateStr) {
      return NextResponse.json(
        { error: "La fecha es obligatoria (campo 'date')" },
        { status: 400 },
      );
    }

    // Validate date format
    const parsedDate = new Date(dateStr);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { error: `Fecha inválida: "${dateStr}". Use formato YYYY-MM-DD` },
        { status: 400 },
      );
    }

    // ─── Process ──────────────────────────────────────────────
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await processDailyCsvUpload(buffer, dateStr);

    return NextResponse.json(result);
  } catch (err) {
    // Known errors
    if (err instanceof Error) {
      if (err.message === "EMPTY_CSV") {
        return NextResponse.json(
          { error: "El archivo CSV está vacío o no contiene filas válidas" },
          { status: 400 },
        );
      }
    }

    // Unexpected errors
    console.error("Daily CSV upload error:", err);
    return NextResponse.json(
      { error: "Error interno al procesar el archivo CSV" },
      { status: 500 },
    );
  }
}

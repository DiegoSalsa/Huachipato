import { processDailyUpload, processWeeklyUpload } from "@/lib/api/upload";
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext, unauthorized } from "@/lib/server-auth";

export async function POST(request: NextRequest) {
  try {
    const context = await getRequestContext(request, ["gps"]);
    if (!context) return unauthorized();
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const mode = formData.get("mode") as string | null; // "daily" or "weekly"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (mode === "weekly") {
      const year = parseInt(formData.get("year") as string, 10);
      const weekNumber = parseInt(formData.get("weekNumber") as string, 10);

      if (!Number.isFinite(year) || !Number.isFinite(weekNumber)) {
        return NextResponse.json(
          { error: "Año y semana son obligatorios para carga semanal" },
          { status: 400 },
        );
      }

      if (weekNumber < 1 || weekNumber > 53) {
        return NextResponse.json(
          { error: "Número de semana debe estar entre 1 y 53" },
          { status: 400 },
        );
      }

      const result = await processWeeklyUpload(file, year, weekNumber, context.squad);
      return NextResponse.json(result);
    } else {
      // Por defecto se procesa como carga diaria
      const reportDate = (formData.get("date") as string) || new Date().toISOString();
      const result = await processDailyUpload(file, reportDate, context.squad);
      return NextResponse.json(result);
    }
  } catch (err) {
    if (err instanceof Error && err.message === "EMPTY_SPREADSHEET") {
      return NextResponse.json(
        { error: "El archivo está vacío" },
        { status: 400 },
      );
    }
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: "Error al procesar archivo" },
      { status: 500 },
    );
  }
}

import { getDailyWeeklyOverview } from "@/backend/services/daily-weekly-overview";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/backend/lib/db";

/**
 * GET /api/overview?date=2026-05-20
 *
 * Returns today's player metrics + current week accumulated totals.
 * If no date is provided, defaults to today.
 */
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");

    let targetDate: Date;
    if (dateParam) {
      targetDate = new Date(dateParam);
    } else {
      const latest = await prisma.gpsDailyReport.findFirst({
        orderBy: { date: "desc" },
        select: { date: true },
      });
      targetDate = latest?.date ? latest.date : new Date();
    }

    if (isNaN(targetDate.getTime())) {
      return NextResponse.json(
        { error: `Fecha inválida: "${dateParam}"` },
        { status: 400 },
      );
    }

    const data = await getDailyWeeklyOverview(targetDate);
    return NextResponse.json(data);
  } catch (err) {
    console.error("Overview API error:", err);
    return NextResponse.json(
      { error: "Error al obtener resumen diario/semanal" },
      { status: 500 },
    );
  }
}

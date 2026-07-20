import { getDailyWeeklyOverview } from "@/lib/services/daily-weekly-overview";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestContext, unauthorized } from "@/lib/server-auth";

//
// GET /api/overview?date=2026-05-20
//
// Returns today's player metrics + current week accumulated totals.
// If no date is provided, defaults to today.
//
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const context = await getRequestContext(request);
    if (!context) return unauthorized();
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");

    let targetDate: Date;
    if (dateParam) {
      targetDate = new Date(dateParam);
    } else {
      const latest = await prisma.gpsDailyReport.findFirst({
        where: { player: { squad: context.squad } },
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

    const data = await getDailyWeeklyOverview(targetDate, context.squad);
    return NextResponse.json(data);
  } catch (err) {
    console.error("Overview API error:", err);
    return NextResponse.json(
      { error: "Error al obtener resumen diario/semanal" },
      { status: 500 },
    );
  }
}

import { computeAllPlayersACWR, getAvailableWeeks } from "@/lib/services/acwr";
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext, unauthorized } from "@/lib/server-auth";

export async function GET(request: NextRequest) {
  const context = await getRequestContext(request);
  if (!context) return unauthorized();
  const { searchParams } = new URL(request.url);
  const yearParam = searchParams.get("year");
  const weekParam = searchParams.get("week");

  // Si no se indica ano y semana, usar la ultima semana disponible
  let year: number;
  let week: number;

  if (yearParam && weekParam) {
    year = parseInt(yearParam, 10);
    week = parseInt(weekParam, 10);
  } else {
    const available = await getAvailableWeeks(context.squad);
    if (available.length === 0) {
      return NextResponse.json({
        players: [],
        week: 0,
        year: 0,
        availableWeeks: [],
      });
    }
    year = available[0].year;
    week = available[0].weekNumber;
  }

  const [players, availableWeeks] = await Promise.all([
    computeAllPlayersACWR(year, week, context.squad),
    getAvailableWeeks(context.squad),
  ]);

  return NextResponse.json({
    players,
    week,
    year,
    availableWeeks,
  });
}

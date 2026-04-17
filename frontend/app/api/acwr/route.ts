import { computeAllPlayersACWR, getAvailableWeeks } from "@/backend/services/acwr";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const yearParam = searchParams.get("year");
  const weekParam = searchParams.get("week");

  // If no year/week, get the latest available week
  let year: number;
  let week: number;

  if (yearParam && weekParam) {
    year = parseInt(yearParam, 10);
    week = parseInt(weekParam, 10);
  } else {
    const available = await getAvailableWeeks();
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
    computeAllPlayersACWR(year, week),
    getAvailableWeeks(),
  ]);

  return NextResponse.json({
    players,
    week,
    year,
    availableWeeks,
  });
}

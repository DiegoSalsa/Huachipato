import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    // Fetch player data
    const player = await prisma.player.findUnique({
      where: { id },
    });

    if (!player) {
      return NextResponse.json({ error: "Jugador no encontrado" }, { status: 404 });
    }

    // Fetch all weekly stats for this player, ordered chronologically
    const weeklyStats = await prisma.weeklyStat.findMany({
      where: { playerId: id },
      orderBy: [{ year: "asc" }, { weekNumber: "asc" }],
    });

    // Build the history array
    // We want to calculate acute and chronic values for each week where possible
    const history = [];

    for (let i = 0; i < weeklyStats.length; i++) {
      const current = weeklyStats[i];
      const weekLabel = `S${current.weekNumber}-${current.year.toString().slice(-2)}`;

      // Calculate chronic (4 weeks). We need the last 4 weeks including current
      let chronicDistance28 = 0;
      let chronicHighVelocity28 = 0;
      let chronicMechImpacts28 = 0;

      // Ensure we actually have 4 consecutive weeks? Or just take the last 4 records if they are consecutive?
      // Since weeklyStats may skip weeks if the player didn't play, we should strictly find the prior 3 weeks
      // or we can use the same logic as `getWeeklyStats4Slots` for absolute correctness.
      // But for the history chart, if they are missing a week, we can just treat it as 0.
      
      const slots = [];
      let curYear = current.year;
      let curWeek = current.weekNumber;
      
      for (let j = 0; j < 4; j++) {
        const found = weeklyStats.find(s => s.year === curYear && s.weekNumber === curWeek);
        slots.push(found ? found : { totalDistance: 0, highVelocity: 0, mechanicalImpacts: 0 });
        
        curWeek--;
        if (curWeek < 1) {
          curYear--;
          curWeek = 52; // Assuming 52 weeks
        }
      }

      chronicDistance28 = (slots[0].totalDistance + slots[1].totalDistance + slots[2].totalDistance + slots[3].totalDistance) / 4;
      chronicHighVelocity28 = (slots[0].highVelocity + slots[1].highVelocity + slots[2].highVelocity + slots[3].highVelocity) / 4;
      chronicMechImpacts28 = (slots[0].mechanicalImpacts + slots[1].mechanicalImpacts + slots[2].mechanicalImpacts + slots[3].mechanicalImpacts) / 4;

      const ratio = chronicDistance28 > 0 ? (current.totalDistance / chronicDistance28) : null;
      let risk = "optimo";
      if (ratio !== null) {
        if (ratio < 0.8) risk = "bajo";
        else if (ratio <= 1.3) risk = "optimo";
        else if (ratio <= 1.5) risk = "cuidado";
        else risk = "alto";
      }

      history.push({
        year: current.year,
        weekNumber: current.weekNumber,
        label: weekLabel,
        acuteDistance: current.totalDistance,
        chronicDistance28,
        acuteHighVelocity: current.highVelocity,
        chronicHighVelocity28,
        acuteMechImpacts: current.mechanicalImpacts,
        chronicMechImpacts28,
        risk
      });
    }

    return NextResponse.json({
      id: player.id,
      name: player.name,
      position: player.position,
      history
    });

  } catch (err) {
    console.error("Error in player profile API:", err);
    return NextResponse.json(
      { error: "Error al cargar perfil del jugador" },
      { status: 500 }
    );
  }
}

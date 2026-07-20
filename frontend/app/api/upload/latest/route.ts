import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext, unauthorized } from "@/lib/server-auth";

//
// GET /api/upload/latest
//
// Returns info about the most recent daily upload from the database.
//
export async function GET(request: NextRequest) {
  try {
    const context = await getRequestContext(request);
    if (!context) return unauthorized();
    // Obtener la sesion mas reciente
    const latestSession = await prisma.gpsDailySession.findFirst({
      where: { player: { squad: context.squad } },
      orderBy: { createdAt: "desc" },
      select: {
        date: true,
        sessionNumber: true,
        createdAt: true,
      },
    });

    if (!latestSession) {
      // Si no hay sesiones, consultar reportes diarios
      const latestReport = await prisma.gpsDailyReport.findFirst({
        where: { player: { squad: context.squad } },
        orderBy: { createdAt: "desc" },
        select: { date: true, createdAt: true },
      });

      if (!latestReport) {
        return NextResponse.json({ latest: null });
      }

      const count = await prisma.gpsDailyReport.count({
        where: { date: latestReport.date, player: { squad: context.squad } },
      });

      return NextResponse.json({
        latest: {
          date: latestReport.date.toISOString(),
          uploadedAt: latestReport.createdAt.toISOString(),
          playersCount: count,
          sessionNumber: 1,
        },
      });
    }

    // Contar jugadores incluidos en la sesion
    const count = await prisma.gpsDailySession.count({
      where: {
        date: latestSession.date,
        sessionNumber: latestSession.sessionNumber,
        player: { squad: context.squad },
      },
    });

    return NextResponse.json({
      latest: {
        date: latestSession.date.toISOString(),
        uploadedAt: latestSession.createdAt.toISOString(),
        playersCount: count,
        sessionNumber: latestSession.sessionNumber,
      },
    });
  } catch (err) {
    console.error("Latest upload error:", err);
    return NextResponse.json(
      { error: "Error al consultar última subida" },
      { status: 500 },
    );
  }
}

import { prisma } from "@/backend/lib/db";
import { NextResponse } from "next/server";

/**
 * GET /api/upload/latest
 *
 * Returns info about the most recent daily upload from the database.
 */
export async function GET() {
  try {
    // Get the most recent session by created_at
    const latestSession = await prisma.gpsDailySession.findFirst({
      orderBy: { createdAt: "desc" },
      select: {
        date: true,
        sessionNumber: true,
        createdAt: true,
      },
    });

    if (!latestSession) {
      // Fallback: check gps_daily_reports if no sessions exist
      const latestReport = await prisma.gpsDailyReport.findFirst({
        orderBy: { createdAt: "desc" },
        select: { date: true, createdAt: true },
      });

      if (!latestReport) {
        return NextResponse.json({ latest: null });
      }

      const count = await prisma.gpsDailyReport.count({
        where: { date: latestReport.date },
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

    // Count how many players were in this session
    const count = await prisma.gpsDailySession.count({
      where: {
        date: latestSession.date,
        sessionNumber: latestSession.sessionNumber,
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

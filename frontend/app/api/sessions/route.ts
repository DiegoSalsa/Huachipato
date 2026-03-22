import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const sessions = await prisma.session.findMany({
    orderBy: { date: "desc" },
    include: {
      segments: true,
      _count: { select: { metrics: true } },
    },
  });

  return NextResponse.json(sessions);
}

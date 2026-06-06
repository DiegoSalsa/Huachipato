import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const players = await prisma.player.findMany({
      include: {
        injuries: {
          orderBy: { dateOfInjury: "desc" },
        },
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(players);
  } catch (error) {
    console.error("Error fetching medical files:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestContext, unauthorized } from "@/lib/server-auth";

export async function GET(request: NextRequest) {
  try {
    const context = await getRequestContext(request, ["medico", "admin"]);
    if (!context) return unauthorized();
    const players = await prisma.player.findMany({
      where: { squad: context.squad },
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

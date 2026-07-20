import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestContext, unauthorized } from "@/lib/server-auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await getRequestContext(request, ["gps", "admin"]);
    if (!context) return unauthorized();
    const { id } = await params;
    const body = await request.json();
    const { photoBase64 } = body;

    if (!photoBase64 || typeof photoBase64 !== "string") {
      return NextResponse.json(
        { error: "Se requiere la imagen en formato Base64" },
        { status: 400 }
      );
    }

    const existing = await prisma.player.findFirst({
      where: { id, squad: context.squad },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Jugador no encontrado" }, { status: 404 });
    }

    const updatedPlayer = await prisma.player.update({
      where: { id },
      data: { photo: photoBase64 },
    });

    return NextResponse.json({
      success: true,
      player: updatedPlayer,
    });
  } catch (error) {
    console.error("Error al actualizar foto del jugador:", error);
    return NextResponse.json(
      { error: "Error al actualizar la foto" },
      { status: 500 }
    );
  }
}

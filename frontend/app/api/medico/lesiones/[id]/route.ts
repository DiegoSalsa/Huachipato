import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestContext, unauthorized } from "@/lib/server-auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await getRequestContext(request, ["medico"]);
    if (!context) return unauthorized();
    const { id } = await params;
    const body = await request.json();
    const { estimatedRecoveryDays, status, severity, description } = body;

    const dataToUpdate: {
      estimatedRecoveryDays?: number;
      status?: string;
      severity?: string;
      description?: string;
    } = {};
    if (estimatedRecoveryDays !== undefined) dataToUpdate.estimatedRecoveryDays = parseInt(estimatedRecoveryDays, 10);
    if (status !== undefined) dataToUpdate.status = status;
    if (severity !== undefined) dataToUpdate.severity = severity;
    if (description !== undefined) dataToUpdate.description = description;

    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const existing = await prisma.injury.findFirst({
      where: { id, player: { squad: context.squad } },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Lesión no encontrada en esta serie" }, { status: 404 });
    }

    const updatedInjury = await prisma.injury.update({
      where: { id },
      data: dataToUpdate,
      include: { player: true },
    });

    return NextResponse.json(updatedInjury, { status: 200 });
  } catch (error) {
    console.error("Error updating injury:", error);
    return NextResponse.json({ error: "Error interno del servidor al actualizar" }, { status: 500 });
  }
}

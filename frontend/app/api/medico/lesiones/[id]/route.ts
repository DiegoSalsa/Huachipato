import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { estimatedRecoveryDays, status, severity, description } = body;

    const dataToUpdate: any = {};
    if (estimatedRecoveryDays !== undefined) dataToUpdate.estimatedRecoveryDays = parseInt(estimatedRecoveryDays, 10);
    if (status !== undefined) dataToUpdate.status = status;
    if (severity !== undefined) dataToUpdate.severity = severity;
    if (description !== undefined) dataToUpdate.description = description;

    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
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

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestContext, unauthorized } from "@/lib/server-auth";
import { isSquad } from "@/lib/squads";

const USER_ROLES = ["medico", "gps"] as const;

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  squad: true,
  status: true,
  lastInviteSentAt: true,
  activatedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await getRequestContext(request, ["admin"]);
  if (!context) return unauthorized();

  const { id } = await params;
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  if (target.role === "admin") {
    return NextResponse.json({ error: "Las cuentas administradoras no se modifican desde este panel" }, { status: 403 });
  }

  try {
    const { name, role, squad, status } = await request.json();
    if (!name?.trim() || !USER_ROLES.includes(role) || !isSquad(squad)) {
      return NextResponse.json({ error: "Nombre, rol o serie inválidos" }, { status: 400 });
    }
    if (!(["ACTIVE", "BLOCKED", "PENDING"] as const).includes(status)) {
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
    }
    if (target.status === "PENDING" && status === "ACTIVE") {
      return NextResponse.json({ error: "El usuario debe activar su cuenta desde la invitación" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { name: name.trim(), role, squad, status },
      select: userSelect,
    });
    return NextResponse.json({ user, message: "Usuario actualizado" });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json({ error: "No se pudo actualizar el usuario" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await getRequestContext(request, ["admin"]);
  if (!context) return unauthorized();

  const { id } = await params;
  if (id === context.user.id) {
    return NextResponse.json({ error: "No puedes eliminar tu propia cuenta" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (!target) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  if (target.role === "admin") {
    return NextResponse.json({ error: "Las cuentas administradoras no se eliminan desde este panel" }, { status: 403 });
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ message: "Usuario eliminado" });
}

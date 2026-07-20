import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestContext, unauthorized } from "@/lib/server-auth";
import { createInvitation, sendInvitationEmail } from "@/lib/user-invitations";
import type { Squad } from "@/lib/squads";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await getRequestContext(request, ["admin"]);
  if (!context) return unauthorized();

  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  if (user.role === "admin" || !["medico", "gps"].includes(user.role)) {
    return NextResponse.json({ error: "No se puede invitar esta cuenta" }, { status: 400 });
  }
  if (user.status !== "PENDING") {
    return NextResponse.json({ error: "Solo se reenvían invitaciones a cuentas pendientes" }, { status: 400 });
  }

  const invitation = createInvitation();
  await prisma.user.update({
    where: { id },
    data: {
      inviteTokenHash: invitation.tokenHash,
      inviteExpiresAt: invitation.expiresAt,
    },
  });

  try {
    await sendInvitationEmail({
      userId: user.id,
      email: user.email,
      name: user.name || user.email,
      role: user.role as "medico" | "gps",
      squad: user.squad as Squad,
      token: invitation.token,
    });
  } catch (error) {
    console.error("Resend invitation error:", error);
    return NextResponse.json({ error: "No se pudo reenviar la invitación" }, { status: 502 });
  }

  const sentAt = new Date();
  await prisma.user.update({ where: { id }, data: { lastInviteSentAt: sentAt } });
  return NextResponse.json({ message: "Invitación reenviada", lastInviteSentAt: sentAt });
}

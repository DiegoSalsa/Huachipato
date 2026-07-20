import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { hashInvitationToken } from "@/lib/user-invitations";

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();
    if (typeof token !== "string" || token.length < 32) {
      return NextResponse.json({ error: "Invitación inválida" }, { status: 400 });
    }
    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 8 caracteres" }, { status: 400 });
    }

    const tokenHash = hashInvitationToken(token);
    const user = await prisma.user.findUnique({ where: { inviteTokenHash: tokenHash } });
    if (!user || user.status !== "PENDING" || !user.inviteExpiresAt || user.inviteExpiresAt <= new Date()) {
      return NextResponse.json(
        { error: "La invitación es inválida o venció. Solicita al administrador que la reenvíe." },
        { status: 410 },
      );
    }

    const result = await prisma.user.updateMany({
      where: {
        id: user.id,
        status: "PENDING",
        inviteTokenHash: tokenHash,
        inviteExpiresAt: { gt: new Date() },
      },
      data: {
        password: await bcrypt.hash(password, 10),
        status: "ACTIVE",
        activatedAt: new Date(),
        inviteTokenHash: null,
        inviteExpiresAt: null,
      },
    });

    if (result.count !== 1) {
      return NextResponse.json({ error: "La invitación ya fue utilizada" }, { status: 409 });
    }
    return NextResponse.json({ message: "Cuenta activada correctamente" });
  } catch (error) {
    console.error("Accept invitation error:", error);
    return NextResponse.json({ error: "No se pudo activar la cuenta" }, { status: 500 });
  }
}

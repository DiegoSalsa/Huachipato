import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getRequestContext, unauthorized } from "@/lib/server-auth";
import { isSquad } from "@/lib/squads";
import { createInvitation, sendInvitationEmail } from "@/lib/user-invitations";

const USER_ROLES = ["medico", "gps"] as const;

export async function GET(request: NextRequest) {
  const context = await getRequestContext(request, ["admin"]);
  if (!context) return unauthorized();

  const users = await prisma.user.findMany({
    select: {
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
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
}

export async function POST(request: NextRequest) {
  const context = await getRequestContext(request, ["admin"]);
  if (!context) return unauthorized();

  try {
    const { name, email, role, squad } = await request.json();
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!name?.trim() || !normalizedEmail) {
      return NextResponse.json(
        { error: "Nombre y correo son obligatorios" },
        { status: 400 },
      );
    }
    if (!USER_ROLES.includes(role) || !isSquad(squad)) {
      return NextResponse.json({ error: "Rol o serie inválidos" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json({ error: "Ya existe un usuario con ese correo" }, { status: 409 });
    }

    const invitation = createInvitation();
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        role,
        squad,
        password: await bcrypt.hash(randomBytes(32).toString("hex"), 10),
        status: "PENDING",
        inviteTokenHash: invitation.tokenHash,
        inviteExpiresAt: invitation.expiresAt,
      },
      select: {
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
      },
    });

    try {
      await sendInvitationEmail({
        userId: user.id,
        email: user.email,
        name: user.name || user.email,
        role,
        squad,
        token: invitation.token,
      });
    } catch (emailError) {
      await prisma.user.delete({ where: { id: user.id } }).catch(() => undefined);
      console.error("Invitation email error:", emailError);
      return NextResponse.json(
        { error: "No se pudo enviar la invitación. El usuario no fue creado." },
        { status: 502 },
      );
    }

    const sentAt = new Date();
    const savedUser = await prisma.user.update({
      where: { id: user.id },
      data: { lastInviteSentAt: sentAt },
      select: {
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
      },
    });

    return NextResponse.json(
      { user: savedUser, message: "Usuario creado e invitación enviada" },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create user error:", error);
    return NextResponse.json({ error: "No se pudo crear el usuario" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getRequestContext, unauthorized } from "@/lib/server-auth";
import { isSquad } from "@/lib/squads";

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
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
}

export async function POST(request: NextRequest) {
  const context = await getRequestContext(request, ["admin"]);
  if (!context) return unauthorized();

  try {
    const { name, email, role, squad, password } = await request.json();
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!name?.trim() || !normalizedEmail || typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Nombre, correo y una contraseña de al menos 8 caracteres son obligatorios" },
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

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        role,
        squad,
        password: await bcrypt.hash(password, 10),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        squad: true,
        createdAt: true,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("Create user error:", error);
    return NextResponse.json({ error: "No se pudo crear el usuario" }, { status: 500 });
  }
}

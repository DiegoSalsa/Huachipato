import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { getRequestContext, unauthorized } from '@/lib/server-auth';
import { isSquad } from '@/lib/squads';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const context = await getRequestContext(request, ['admin']);
    if (!context) return unauthorized();
    const { email, password, name, role, squad } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    if (!['medico', 'gps'].includes(role) || !isSquad(squad)) {
      return NextResponse.json(
        { message: 'Rol o serie inválidos' },
        { status: 400 }
      );
    }

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'El usuario ya existe' },
        { status: 409 }
      );
    }

    // Hashear contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || email,
        role,
        squad,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        squad: true,
      },
    });

    return NextResponse.json(
      {
        message: 'Usuario creado exitosamente',
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

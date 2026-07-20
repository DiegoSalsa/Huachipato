import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateToken } from '../jwt-utils';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { email, password, rememberMe } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email: String(email).trim().toLowerCase() },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    if (user.status === 'PENDING') {
      return NextResponse.json(
        { message: 'Debes activar tu cuenta desde el correo de invitación' },
        { status: 403 }
      );
    }

    if (user.status === 'BLOCKED') {
      return NextResponse.json(
        { message: 'Tu cuenta está bloqueada. Contacta al administrador' },
        { status: 403 }
      );
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { message: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // Generar token
    const token = generateToken(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        squad: user.squad,
      },
      rememberMe === true,
    );

    return NextResponse.json(
      {
        message: 'Inicio de sesión exitoso',
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          squad: user.squad,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

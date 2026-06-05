import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Verificar si ya existe un usuario
    const userCount = await prisma.user.count();
    
    if (userCount > 0) {
      return NextResponse.json(
        { message: 'Ya existen usuarios en el sistema' },
        { status: 400 }
      );
    }

    // Crear usuario admin de prueba
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    const user = await prisma.user.create({
      data: {
        email: 'admin@huachipato.cl',
        password: hashedPassword,
        name: 'Administrador',
        role: 'admin',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    return NextResponse.json(
      {
        message: 'Usuario administrador creado exitosamente',
        user,
        credentials: {
          email: 'admin@huachipato.cl',
          password: 'admin123',
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json(
      { message: 'Error al crear usuario' },
      { status: 500 }
    );
  }
}

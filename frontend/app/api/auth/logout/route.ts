import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // El logout en el lado del cliente es simplemente eliminar el token
    // Esta es una confirmación del servidor
    return NextResponse.json(
      { message: 'Logout exitoso' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

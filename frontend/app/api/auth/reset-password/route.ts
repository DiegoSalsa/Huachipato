import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getPasswordError } from "@/lib/password-policy";
import { hashPasswordResetToken } from "@/lib/password-reset";

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();
    if (typeof token !== "string" || token.length < 32) {
      return NextResponse.json({ message: "El enlace no es válido." }, { status: 400 });
    }
    const passwordError = getPasswordError(password);
    if (passwordError) return NextResponse.json({ message: passwordError }, { status: 400 });

    const tokenHash = hashPasswordResetToken(token);
    const user = await prisma.user.findUnique({ where: { passwordResetTokenHash: tokenHash } });
    if (!user || user.status !== "ACTIVE" || !user.passwordResetExpiresAt || user.passwordResetExpiresAt <= new Date()) {
      return NextResponse.json({ message: "El enlace es inválido o venció. Solicita uno nuevo." }, { status: 410 });
    }

    const result = await prisma.user.updateMany({
      where: {
        id: user.id,
        status: "ACTIVE",
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: { gt: new Date() },
      },
      data: {
        password: await bcrypt.hash(password, 10),
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
        passwordResetSentAt: null,
      },
    });

    if (result.count !== 1) {
      return NextResponse.json({ message: "El enlace ya fue utilizado." }, { status: 409 });
    }

    return NextResponse.json({ message: "Contraseña actualizada correctamente." });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ message: "No pudimos actualizar la contraseña." }, { status: 500 });
  }
}

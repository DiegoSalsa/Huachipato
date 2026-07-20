import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPasswordReset, sendPasswordResetEmail } from "@/lib/password-reset";

const GENERIC_MESSAGE = "Si el correo corresponde a una cuenta activa, recibirás un enlace para restablecer tu contraseña.";
const RESEND_COOLDOWN_MS = 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ message: "Ingresa un correo válido." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.status !== "ACTIVE") {
      return NextResponse.json({ message: GENERIC_MESSAGE });
    }

    const reset = createPasswordReset();
    const reserved = await prisma.user.updateMany({
      where: {
        id: user.id,
        status: "ACTIVE",
        OR: [
          { passwordResetSentAt: null },
          { passwordResetSentAt: { lt: new Date(Date.now() - RESEND_COOLDOWN_MS) } },
        ],
      },
      data: {
        passwordResetTokenHash: reset.tokenHash,
        passwordResetExpiresAt: reset.expiresAt,
        passwordResetSentAt: new Date(),
      },
    });
    if (reserved.count !== 1) {
      return NextResponse.json({ message: GENERIC_MESSAGE });
    }

    try {
      await sendPasswordResetEmail({
        userId: user.id,
        email: user.email,
        name: user.name,
        token: reset.token,
      });
    } catch (error) {
      console.error("Password reset email error:", error);
      await prisma.user.updateMany({
        where: { id: user.id, passwordResetTokenHash: reset.tokenHash },
        data: {
          passwordResetTokenHash: null,
          passwordResetExpiresAt: null,
          passwordResetSentAt: null,
        },
      });
    }

    return NextResponse.json({ message: GENERIC_MESSAGE });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ message: "No pudimos procesar la solicitud. Intenta nuevamente." }, { status: 500 });
  }
}

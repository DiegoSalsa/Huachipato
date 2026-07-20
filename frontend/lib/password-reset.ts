import "server-only";

import { createHash, randomBytes } from "node:crypto";

const RESET_TTL_MINUTES = 60;
const DEFAULT_APP_URL = "https://www.datahuachipatofc.cl";
const DEFAULT_FROM = "Huachipato FC <acceso@datahuachipatofc.cl>";

export function createPasswordReset() {
  const token = randomBytes(32).toString("hex");
  return {
    token,
    tokenHash: hashPasswordResetToken(token),
    expiresAt: new Date(Date.now() + RESET_TTL_MINUTES * 60 * 1000),
  };
}

export function hashPasswordResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function sendPasswordResetEmail({
  userId,
  email,
  name,
  token,
}: {
  userId: string;
  email: string;
  name: string | null;
  token: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY no está configurada");

  const appUrl = (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL).replace(/\/$/, "");
  const resetUrl = `${appUrl}/restablecer-contrasena?token=${encodeURIComponent(token)}`;
  const safeName = escapeHtml(name?.trim() || "");
  const greeting = safeName ? `Hola, ${safeName}` : "Hola";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `password-reset-${userId}-${Date.now()}`,
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL || DEFAULT_FROM,
      to: [email],
      subject: "Restablece tu contraseña de Huachipato Analytics",
      html: `
        <div style="background:#f1f5f9;padding:32px 16px;font-family:Arial,sans-serif;color:#0f172a">
          <div style="max-width:560px;margin:auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">
            <div style="background:#006195;padding:24px 28px;color:#fff">
              <div style="font-size:20px;font-weight:700">Huachipato Analytics</div>
              <div style="font-size:12px;opacity:.8;margin-top:4px">Club Deportivo Huachipato</div>
            </div>
            <div style="padding:28px">
              <h1 style="font-size:22px;margin:0 0 16px">${greeting}</h1>
              <p style="font-size:15px;line-height:1.6;color:#475569">Recibimos una solicitud para cambiar la contraseña de tu cuenta.</p>
              <p style="font-size:15px;line-height:1.6;color:#475569">Este enlace vence en ${RESET_TTL_MINUTES} minutos y solo puede utilizarse una vez.</p>
              <a href="${resetUrl}" style="display:inline-block;margin:12px 0 20px;background:#0085CB;color:#fff;text-decoration:none;font-weight:700;padding:13px 22px;border-radius:10px">Crear nueva contraseña</a>
              <p style="font-size:12px;line-height:1.5;color:#94a3b8">Si no solicitaste este cambio, puedes ignorar este correo. Tu contraseña actual seguirá funcionando.</p>
            </div>
          </div>
        </div>`,
      text: `Restablece tu contraseña de Huachipato Analytics en ${resetUrl}. El enlace vence en ${RESET_TTL_MINUTES} minutos. Si no lo solicitaste, ignora este correo.`,
    }),
  });

  const result = await response.json().catch(() => null) as { id?: string; message?: string } | null;
  if (!response.ok) {
    throw new Error(result?.message || `Resend respondió con estado ${response.status}`);
  }

  return result?.id ?? null;
}

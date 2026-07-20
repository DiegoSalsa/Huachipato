import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { SQUAD_LABELS, type Squad } from "@/lib/squads";

const INVITATION_TTL_HOURS = 48;
const DEFAULT_APP_URL = "https://www.datahuachipatofc.cl";
const DEFAULT_FROM = "Huachipato FC <acceso@datahuachipatofc.cl>";

export function createInvitation() {
  const token = randomBytes(32).toString("hex");
  return {
    token,
    tokenHash: hashInvitationToken(token),
    expiresAt: new Date(Date.now() + INVITATION_TTL_HOURS * 60 * 60 * 1000),
  };
}

export function hashInvitationToken(token: string) {
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

export async function sendInvitationEmail({
  userId,
  email,
  name,
  role,
  squad,
  token,
}: {
  userId: string;
  email: string;
  name: string;
  role: "medico" | "gps";
  squad: Squad;
  token: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY no está configurada");

  const appUrl = (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL).replace(/\/$/, "");
  const invitationUrl = `${appUrl}/activar-cuenta?token=${encodeURIComponent(token)}`;
  const safeName = escapeHtml(name);
  const roleLabel = role === "medico" ? "Área Médica" : "Personal GPS";
  const squadLabel = SQUAD_LABELS[squad];

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `invite-${userId}-${Date.now()}`,
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL || DEFAULT_FROM,
      to: [email],
      subject: "Activa tu acceso a Huachipato Analytics",
      html: `
        <div style="background:#f1f5f9;padding:32px 16px;font-family:Arial,sans-serif;color:#0f172a">
          <div style="max-width:560px;margin:auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">
            <div style="background:#006195;padding:24px 28px;color:#fff">
              <div style="font-size:20px;font-weight:700">Huachipato Analytics</div>
              <div style="font-size:12px;opacity:.8;margin-top:4px">Club Deportivo Huachipato</div>
            </div>
            <div style="padding:28px">
              <h1 style="font-size:22px;margin:0 0 16px">Hola, ${safeName}</h1>
              <p style="font-size:15px;line-height:1.6;color:#475569">Fuiste invitado al sistema oficial de análisis deportivo como <strong>${roleLabel}</strong> de la serie <strong>${squadLabel}</strong>.</p>
              <p style="font-size:15px;line-height:1.6;color:#475569">Define tu contraseña para activar el acceso. Este enlace vence en ${INVITATION_TTL_HOURS} horas y solo puede utilizarse una vez.</p>
              <a href="${invitationUrl}" style="display:inline-block;margin:12px 0 20px;background:#0085CB;color:#fff;text-decoration:none;font-weight:700;padding:13px 22px;border-radius:10px">Activar mi cuenta</a>
              <p style="font-size:12px;line-height:1.5;color:#94a3b8">Si no esperabas esta invitación, puedes ignorar este correo.</p>
            </div>
          </div>
        </div>`,
      text: `Hola, ${name}. Activa tu acceso a Huachipato Analytics (${roleLabel}, ${squadLabel}) en ${invitationUrl}. El enlace vence en ${INVITATION_TTL_HOURS} horas.`,
    }),
  });

  const result = await response.json().catch(() => null) as { id?: string; message?: string } | null;
  if (!response.ok) {
    throw new Error(result?.message || `Resend respondió con estado ${response.status}`);
  }

  return result?.id ?? null;
}

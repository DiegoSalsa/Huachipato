import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { SQUAD_LABELS, type Squad } from "@/lib/squads";

const INVITATION_TTL_HOURS = 48;
const DEFAULT_APP_URL = "https://www.datahuachipatofc.cl";
const DEFAULT_FROM = "Huachipato FC <acceso@datahuachipatofc.cl>";
const EMAIL_LOGO_SOURCE =
  "https://vectorseek.com/wp-content/uploads/2024/01/Huachipato-FC-Logo-Vector.svg-.png";

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

function encodeNonAsciiHtml(value: string) {
  return Array.from(value, (character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint > 127 ? `&#${codePoint};` : character;
  }).join("");
}

function toAsciiText(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
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
  role: "medico" | "gps" | "admin";
  squad: Squad;
  token: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY no está configurada");

  const appUrl = (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL).replace(/\/$/, "");
  const invitationUrl = `${appUrl}/activar-cuenta?token=${encodeURIComponent(token)}`;
  const safeName = escapeHtml(name);
  const roleLabel =
    role === "admin" ? "Administrador" : role === "medico" ? "Área Médica" : "Personal GPS";
  const assignmentLabel =
    role === "admin"
      ? "con acceso a todas las series"
      : `de la serie <strong>${SQUAD_LABELS[squad]}</strong>`;
  const assignmentText =
    role === "admin" ? "con acceso a todas las series" : `de la serie ${SQUAD_LABELS[squad]}`;
  const emailHtml = `
    <!doctype html>
    <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <meta name="color-scheme" content="light">
        <title>Invitación a Huachipato Analytics</title>
      </head>
      <body style="margin:0;padding:0;background:#eaf0f4;font-family:Arial,Helvetica,sans-serif;color:#172033">
        <div style="display:none;max-height:0;overflow:hidden;opacity:0">
          Activa tu cuenta y configura tu contraseña para ingresar a Huachipato Analytics.
        </div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#eaf0f4">
          <tr>
            <td align="center" style="padding:36px 14px">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:620px;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #dce5eb;box-shadow:0 16px 40px rgba(18,43,62,.10)">
                <tr>
                  <td style="height:7px;background:#0085cb;font-size:0;line-height:0">&nbsp;</td>
                </tr>
                <tr>
                  <td style="padding:24px 34px;border-bottom:1px solid #e7edf1">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td width="74" valign="middle">
                          <img src="cid:huachipato-logo" width="58" alt="Huachipato FC" style="display:block;width:58px;height:auto;border:0">
                        </td>
                        <td valign="middle">
                          <div style="font-size:18px;line-height:24px;font-weight:800;color:#101828">Huachipato Analytics</div>
                          <div style="margin-top:3px;font-size:11px;line-height:16px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#667085">Club Deportivo Huachipato</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="background:#006195;padding:34px;color:#ffffff">
                    <div style="font-size:12px;line-height:18px;font-weight:800;letter-spacing:1.8px;text-transform:uppercase;color:#b9e6ff">Invitación a la plataforma</div>
                    <h1 style="margin:8px 0 0;font-size:30px;line-height:38px;font-weight:800;color:#ffffff">Tu acceso está listo</h1>
                    <p style="margin:10px 0 0;font-size:15px;line-height:24px;color:#d8f1ff">Solo falta que definas tu contraseña para comenzar.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:34px">
                    <p style="margin:0 0 18px;font-size:18px;line-height:28px;font-weight:700;color:#172033">Hola, ${safeName}</p>
                    <p style="margin:0;font-size:15px;line-height:25px;color:#526071">Te invitamos a formar parte del sistema oficial de análisis deportivo del Club Deportivo Huachipato.</p>

                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0;background:#f1f8fc;border:1px solid #cce7f5;border-radius:12px">
                      <tr>
                        <td style="padding:17px 19px">
                          <div style="font-size:11px;line-height:16px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;color:#34708f">Perfil asignado</div>
                          <div style="margin-top:5px;font-size:16px;line-height:24px;font-weight:800;color:#005b89">${roleLabel}</div>
                          <div style="font-size:13px;line-height:20px;color:#526b78">${assignmentLabel}</div>
                        </td>
                      </tr>
                    </table>

                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td align="center" bgcolor="#0085CB" style="border-radius:10px">
                          <a href="${invitationUrl}" style="display:inline-block;padding:15px 26px;font-size:15px;line-height:20px;font-weight:800;color:#ffffff;text-decoration:none;border-radius:10px">Configurar mi contraseña</a>
                        </td>
                      </tr>
                    </table>

                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:26px;border-top:1px solid #e7edf1">
                      <tr>
                        <td style="padding-top:20px">
                          <p style="margin:0;font-size:12px;line-height:20px;color:#6b7787"><strong style="color:#344054">Enlace seguro:</strong> vence en ${INVITATION_TTL_HOURS} horas y puede utilizarse una sola vez. Si no esperabas esta invitación, no necesitas realizar ninguna acción.</p>
                        </td>
                      </tr>
                    </table>

                    <p style="margin:22px 0 0;font-size:11px;line-height:18px;color:#98a2b3">Si el botón no funciona, copia y pega este enlace en tu navegador:<br><a href="${invitationUrl}" style="color:#006195;word-break:break-all">${invitationUrl}</a></p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="background:#f7f9fb;padding:20px 30px;border-top:1px solid #e7edf1">
                    <p style="margin:0;font-size:11px;line-height:18px;color:#8a96a6">Huachipato Analytics · Acceso exclusivo para personal autorizado</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>`;
  const emailText = `Hola, ${name}.

Te invitamos a Huachipato Analytics como ${roleLabel} ${assignmentText}.

Configura tu contraseña y activa tu cuenta aquí:
${invitationUrl}

El enlace vence en ${INVITATION_TTL_HOURS} horas y solo puede utilizarse una vez.`;

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
      html: encodeNonAsciiHtml(emailHtml),
      text: toAsciiText(emailText),
      attachments: [
        {
          path: EMAIL_LOGO_SOURCE,
          filename: "huachipato-logo.png",
          content_id: "huachipato-logo",
        },
      ],
    }),
  });

  const result = await response.json().catch(() => null) as { id?: string; message?: string } | null;
  if (!response.ok) {
    throw new Error(result?.message || `Resend respondió con estado ${response.status}`);
  }

  return result?.id ?? null;
}

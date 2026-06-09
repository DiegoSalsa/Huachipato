/**
 * Generador de Reportes PDF — Club Deportivo Huachipato
 * 
 * Genera un documento PDF profesional con la identidad visual del club,
 * incluyendo la tabla ACS completa con semáforo de riesgo.
 */
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ─── Club Branding ──────────────────────────────────────────────────
const COLORS = {
  primary:    [0, 101, 149] as [number, number, number],   // #006595 — azul Huachipato oscuro
  secondary:  [0, 133, 203] as [number, number, number],   // #0085CB — azul Huachipato
  dark:       [15, 28, 35]  as [number, number, number],   // #0f1c23 — texto oscuro
  white:      [255, 255, 255] as [number, number, number],
  lightGray:  [248, 250, 252] as [number, number, number], // fondo alterno filas
  midGray:    [148, 163, 184] as [number, number, number], // texto secundario
  border:     [226, 232, 240] as [number, number, number], // bordes suaves
};

const RISK_COLORS: Record<string, { bg: [number, number, number]; text: [number, number, number]; label: string }> = {
  optimo:  { bg: [209, 250, 229], text: [4, 120, 87],    label: "Óptimo" },
  cuidado: { bg: [254, 243, 199], text: [146, 64, 14],   label: "Cuidado" },
  alto:    { bg: [254, 226, 226], text: [153, 27, 27],   label: "Alto Riesgo" },
  bajo:    { bg: [224, 242, 254], text: [3, 105, 161],    label: "Bajo" },
};

const POSITION_LABELS: Record<string, string> = {
  PORTERO: "Portero",
  DEFENSA: "Defensa",
  MEDIOCAMPISTA: "Mediocampista",
  DELANTERO: "Delantero",
};

// ─── Types (mirrored from Dashboard) ────────────────────────────────

type AcwrRisk = "bajo" | "optimo" | "cuidado" | "alto";

interface PlayerData {
  playerName: string;
  position: string;
  currentWeek: { totalDistance: number; highVelocity: number; mechanicalImpacts: number } | null;
  ratioDistance28: number | null;
  ratioHighVelocity28: number | null;
  ratioMechImpacts28: number | null;
  riskDistance: AcwrRisk | null;
  riskHighVelocity: AcwrRisk | null;
  riskMechImpacts: AcwrRisk | null;
  overallRisk: AcwrRisk | null;
  ratioDistance21: number | null;
  ratioHighVelocity21: number | null;
  ratioMechImpacts21: number | null;
  riskDistance21: AcwrRisk | null;
  riskHighVelocity21: AcwrRisk | null;
  riskMechImpacts21: AcwrRisk | null;
  overallRisk21: AcwrRisk | null;
}

interface ReportParams {
  players: PlayerData[];
  week: number;
  year: number;
  period: "28" | "21";
  logoBase64: string;
}

// ─── Helpers ────────────────────────────────────────────────────────

function fmtRatio(r: number | null): string {
  return r !== null ? r.toFixed(2) : "—";
}

function fmtDist(meters: number): string {
  return (meters / 1000).toFixed(1) + " km";
}

function getRisk(p: PlayerData, period: "28" | "21"): AcwrRisk | null {
  return period === "28" ? p.overallRisk : p.overallRisk21;
}

function getRiskLabel(risk: AcwrRisk | null): string {
  if (!risk) return "Sin datos";
  return RISK_COLORS[risk]?.label ?? risk;
}

// ─── PDF Generator ──────────────────────────────────────────────────

export async function generateACSReport({ players, week, year, period, logoBase64 }: ReportParams): Promise<void> {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  // ─── HEADER BAND ──────────────────────────────────────────────
  // Top accent bar
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 3, "F");

  // Logo
  try {
    doc.addImage(logoBase64, "PNG", margin, 8, 18, 18);
  } catch {
    // If logo fails, skip it gracefully
  }

  // Title block
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...COLORS.dark);
  doc.text("CLUB DEPORTIVO HUACHIPATO", margin + 22, 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.midGray);
  doc.text("Departamento de Rendimiento Físico", margin + 22, 22);

  // Report title and metadata (right side)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.secondary);
  doc.text("Reporte ACS Semanal", pageWidth - margin, 14, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.midGray);
  const today = new Date().toLocaleDateString("es-CL", {
    day: "numeric", month: "long", year: "numeric",
  });
  doc.text(`Semana ${week} · ${year}  |  Periodo ${period} días  |  ${today}`, pageWidth - margin, 20, { align: "right" });

  // Divider line
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.5);
  doc.line(margin, 30, pageWidth - margin, 30);

  // ─── KPI SUMMARY BOXES ────────────────────────────────────────
  const yKpi = 35;
  const boxW = contentWidth / 5;
  const boxH = 18;

  const counts = {
    total: players.length,
    optimo: players.filter(p => getRisk(p, period) === "optimo").length,
    cuidado: players.filter(p => getRisk(p, period) === "cuidado").length,
    alto: players.filter(p => getRisk(p, period) === "alto").length,
    bajo: players.filter(p => getRisk(p, period) === "bajo").length,
  };

  const kpis = [
    { label: "PLANTEL",     value: String(counts.total),   color: COLORS.dark,    bgColor: [241, 245, 249] as [number, number, number] },
    { label: "ÓPTIMO",      value: String(counts.optimo),  color: [4, 120, 87] as [number, number, number],   bgColor: [209, 250, 229] as [number, number, number] },
    { label: "CUIDADO",     value: String(counts.cuidado), color: [146, 64, 14] as [number, number, number],  bgColor: [254, 243, 199] as [number, number, number] },
    { label: "ALTO RIESGO", value: String(counts.alto),    color: [153, 27, 27] as [number, number, number],  bgColor: [254, 226, 226] as [number, number, number] },
    { label: "BAJO",        value: String(counts.bajo),    color: [3, 105, 161] as [number, number, number],  bgColor: [224, 242, 254] as [number, number, number] },
  ];

  kpis.forEach((kpi, i) => {
    const x = margin + i * boxW;
    
    // Box background
    doc.setFillColor(...kpi.bgColor);
    doc.roundedRect(x + 1, yKpi, boxW - 2, boxH, 2, 2, "F");

    // Label
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.midGray);
    doc.text(kpi.label, x + boxW / 2, yKpi + 6, { align: "center" });

    // Value
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...kpi.color);
    doc.text(kpi.value, x + boxW / 2, yKpi + 14, { align: "center" });
  });

  // ─── DATA TABLE ───────────────────────────────────────────────
  const yTable = yKpi + boxH + 8;

  // Section title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.dark);
  doc.text("Tabla ACS del Plantel", margin, yTable);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.midGray);
  doc.text(`Ratios calculados con fórmula de carga crónica ${period} días · Semáforo de riesgo`, margin, yTable + 5);

  // Sort: alto first, then cuidado, bajo, optimo, null
  const priority: Record<string, number> = { alto: 0, cuidado: 1, bajo: 2, optimo: 3 };
  const sorted = [...players].sort((a, b) => {
    const ra = getRisk(a, period);
    const rb = getRisk(b, period);
    const pa = ra ? priority[ra] ?? 4 : 4;
    const pb = rb ? priority[rb] ?? 4 : 4;
    return pa - pb;
  });

  // Build table data
  const tableHead = [
    ["#", "Jugador", "Posición", "Dist. Semanal", "A:C Distancia", "A:C Alta Vel.", "A:C Impactos", "Estado"],
  ];

  const tableBody = sorted.map((p, idx) => {
    const risk = getRisk(p, period);
    const rDist = period === "28" ? p.ratioDistance28 : p.ratioDistance21;
    const rVel = period === "28" ? p.ratioHighVelocity28 : p.ratioHighVelocity21;
    const rImp = period === "28" ? p.ratioMechImpacts28 : p.ratioMechImpacts21;

    return [
      String(idx + 1),
      p.playerName,
      POSITION_LABELS[p.position] ?? p.position,
      p.currentWeek ? fmtDist(p.currentWeek.totalDistance) : "—",
      fmtRatio(rDist),
      fmtRatio(rVel),
      fmtRatio(rImp),
      getRiskLabel(risk),
    ];
  });

  autoTable(doc, {
    startY: yTable + 8,
    margin: { left: margin, right: margin },
    head: tableHead,
    body: tableBody,
    theme: "plain",
    styles: {
      font: "helvetica",
      fontSize: 8.5,
      cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
      lineColor: COLORS.border,
      lineWidth: 0.2,
      textColor: COLORS.dark,
      valign: "middle",
    },
    headStyles: {
      fillColor: COLORS.primary,
      textColor: COLORS.white,
      fontStyle: "bold",
      fontSize: 7.5,
      halign: "center",
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },                    // #
      1: { halign: "left", fontStyle: "bold", cellWidth: 45 },    // Jugador
      2: { halign: "left", cellWidth: 32 },                       // Posición
      3: { halign: "right", cellWidth: 28 },                      // Dist. Semanal
      4: { halign: "center", cellWidth: 30 },                     // A:C Distancia
      5: { halign: "center", cellWidth: 30 },                     // A:C Alta Vel.
      6: { halign: "center", cellWidth: 30 },                     // A:C Impactos
      7: { halign: "center", cellWidth: 32, fontStyle: "bold" },  // Estado
    },
    alternateRowStyles: {
      fillColor: COLORS.lightGray,
    },
    didParseCell: (data) => {
      // Color the "Estado" column based on risk
      if (data.section === "body" && data.column.index === 7) {
        const val = data.cell.raw as string;
        const riskKey = Object.entries(RISK_COLORS).find(([, v]) => v.label === val);
        if (riskKey) {
          data.cell.styles.fillColor = riskKey[1].bg;
          data.cell.styles.textColor = riskKey[1].text;
        }
      }
      // Color ratio cells based on value
      if (data.section === "body" && data.column.index >= 4 && data.column.index <= 6) {
        const val = parseFloat(data.cell.raw as string);
        if (!isNaN(val)) {
          if (val > 1.5)       { data.cell.styles.textColor = [153, 27, 27]; }
          else if (val > 1.3)  { data.cell.styles.textColor = [146, 64, 14]; }
          else if (val >= 0.8) { data.cell.styles.textColor = [4, 120, 87]; }
          else                 { data.cell.styles.textColor = [3, 105, 161]; }
        }
      }
    },
  });

  // ─── LEGEND ───────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = (doc as any).lastAutoTable?.finalY ?? 160;
  const yLegend = finalY + 6;

  if (yLegend + 16 < pageHeight - 20) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.midGray);
    doc.text("GUÍA DE SEMÁFORO ACS", margin, yLegend);

    const legends = [
      { color: [56, 189, 248] as [number, number, number],  text: "< 0.80 — Bajo (subentrenamiento)" },
      { color: [52, 211, 153] as [number, number, number],  text: "0.80 – 1.30 — Óptimo" },
      { color: [251, 191, 36] as [number, number, number],  text: "1.31 – 1.50 — Cuidado" },
      { color: [248, 113, 113] as [number, number, number], text: "> 1.50 — Alto Riesgo (sobrecarga)" },
    ];

    legends.forEach((leg, i) => {
      const x = margin + i * (contentWidth / 4);
      doc.setFillColor(...leg.color);
      doc.circle(x + 2, yLegend + 5, 1.5, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...COLORS.dark);
      doc.text(leg.text, x + 6, yLegend + 6);
    });
  }

  // ─── FOOTER ───────────────────────────────────────────────────
  // Bottom accent bar
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, pageHeight - 3, pageWidth, 3, "F");

  // Footer text
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.midGray);
  doc.text(
    "CONFIDENCIAL — Club Deportivo Huachipato · Departamento de Rendimiento Físico",
    margin, pageHeight - 7
  );
  doc.text(
    `Generado: ${today}  |  Semana ${week}, ${year}`,
    pageWidth - margin, pageHeight - 7,
    { align: "right" }
  );

  // ─── SAVE ─────────────────────────────────────────────────────
  const fileName = `ACS_Huachipato_S${week}_${year}_${period}d.pdf`;
  doc.save(fileName);
}

// ─── Logo Loader (converts image URL to base64) ─────────────────────

export async function loadLogoBase64(): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve("");
    img.src = "/huachipato-logo.png";
  });
}

import { prisma } from "@/lib/prisma";

/**
 * ACWR (Acute:Chronic Workload Ratio) Calculator
 *
 * Formulas (from the club's Excel — FIXED DENOMINATOR):
 *   Acute Load   = metric value of the current week
 *   Chronic 28d  = (S_actual + S_n-1 + S_n-2 + S_n-3) / 4
 *
 * REGLA DE ORO: Always divide by 4, even if some weeks have no data.
 * Missing weeks count as 0. This matches the Excel's *0.25 formula.
 *
 * Ratios computed:
 *   1. A:C Distance 28d
 *   2. A:C High Velocity 28d
 *   3. A:C Mechanical Impacts 28d
 */

export type AcwrRisk = "bajo" | "optimo" | "cuidado" | "alto";

export interface PlayerAcwr {
  playerId: string;
  playerName: string;
  position: string;
  currentWeek: {
    totalDistance: number;
    highVelocity: number;
    mechanicalImpacts: number;
  } | null;
  acuteDistance: number | null;
  chronicDistance28: number | null;
  acuteHighVelocity: number | null;
  chronicHighVelocity28: number | null;
  acuteMechImpacts: number | null;
  chronicMechImpacts28: number | null;
  ratioDistance28: number | null;
  ratioHighVelocity28: number | null;
  ratioMechImpacts28: number | null;
  riskDistance: AcwrRisk | null;
  riskHighVelocity: AcwrRisk | null;
  riskMechImpacts: AcwrRisk | null;
  overallRisk: AcwrRisk | null;
  
  // 21 days metrics (3 weeks)
  chronicDistance21: number | null;
  chronicHighVelocity21: number | null;
  chronicMechImpacts21: number | null;
  ratioDistance21: number | null;
  ratioHighVelocity21: number | null;
  ratioMechImpacts21: number | null;
  riskDistance21: AcwrRisk | null;
  riskHighVelocity21: AcwrRisk | null;
  riskMechImpacts21: AcwrRisk | null;
  overallRisk21: AcwrRisk | null;

  weeksAvailable: number;
}

/**
 * Classify ACWR ratio into risk zone.
 */
export function classifyRisk(ratio: number | null): AcwrRisk | null {
  if (ratio === null || ratio === undefined) return null;
  if (ratio < 0.8) return "bajo";
  if (ratio <= 1.3) return "optimo";
  if (ratio <= 1.5) return "cuidado";
  return "alto";
}

/**
 * Get the worst risk among multiple individual risks.
 */
function worstRisk(risks: (AcwrRisk | null)[]): AcwrRisk | null {
  const validRisks = risks.filter((r): r is AcwrRisk => r !== null);
  if (validRisks.length === 0) return null;

  const priority: AcwrRisk[] = ["alto", "bajo", "cuidado", "optimo"];
  for (const level of priority) {
    if (validRisks.includes(level)) return level;
  }
  return "optimo";
}

/**
 * Build the 4 week slots (current + 3 previous) with fixed positions.
 * Missing weeks are { totalDistance: 0, highVelocity: 0, mechanicalImpacts: 0 }.
 * This ensures division by 4 ALWAYS, matching the club's Excel.
 */
async function getWeeklyStats4Slots(
  playerId: string,
  year: number,
  week: number,
) {
  // Build the 4 (year, weekNumber) pairs going backwards
  const weekPairs: { year: number; weekNumber: number }[] = [];
  let curYear = year;
  let curWeek = week;

  for (let i = 0; i < 4; i++) {
    weekPairs.push({ year: curYear, weekNumber: curWeek });
    curWeek--;
    if (curWeek < 1) {
      curYear--;
      curWeek = 52;
    }
  }

  // Fetch whatever data exists
  const stats = await prisma.weeklyStat.findMany({
    where: {
      playerId,
      OR: weekPairs.map((wp) => ({
        year: wp.year,
        weekNumber: wp.weekNumber,
      })),
    },
  });

  // Build fixed 4-slot array: [S_actual, S_n-1, S_n-2, S_n-3]
  // Missing weeks → all zeros
  const ZERO = { totalDistance: 0, highVelocity: 0, mechanicalImpacts: 0 };

  const slots = weekPairs.map((wp) => {
    const found = stats.find(
      (s) => s.year === wp.year && s.weekNumber === wp.weekNumber,
    );
    return found
      ? {
          totalDistance: found.totalDistance,
          highVelocity: found.highVelocity,
          mechanicalImpacts: found.mechanicalImpacts,
        }
      : { ...ZERO };
  });

  return { slots, weekPairs, foundCount: stats.length };
}

/**
 * Compute ACWR for a single player for a given week/year.
 *
 * FÓRMULA EXACTA (sin excepciones):
 *   Acute  = Valor de S_actual
 *   Chronic = (S_actual + S_n-1 + S_n-2 + S_n-3) / 4
 *   Ratio  = Acute / Chronic
 *
 * Si una semana no existe en la DB → su valor es 0.
 * SIEMPRE dividir por 4.
 * Si Chronic = 0 → ratio = null (se muestra "Sin datos" en la UI).
 */
export async function computePlayerACWR(
  playerId: string,
  playerName: string,
  position: string,
  year: number,
  week: number,
): Promise<PlayerAcwr> {
  const { slots, foundCount } = await getWeeklyStats4Slots(playerId, year, week);

  // Check if player has ANY weekly_stat for the queried week
  const currentSlot = slots[0]; // S_actual
  const currentWeekHasData = foundCount > 0 && (
    currentSlot.totalDistance > 0 ||
    currentSlot.highVelocity > 0 ||
    currentSlot.mechanicalImpacts > 0
  );

  // If current week has NO data → all null (no ratio to show)
  if (!currentWeekHasData) {
    return {
      playerId,
      playerName,
      position,
      currentWeek: null,
      acuteDistance: null,
      chronicDistance28: null,
      acuteHighVelocity: null,
      chronicHighVelocity28: null,
      acuteMechImpacts: null,
      chronicMechImpacts28: null,
      ratioDistance28: null,
      ratioHighVelocity28: null,
      ratioMechImpacts28: null,
      riskDistance: null,
      riskHighVelocity: null,
      riskMechImpacts: null,
      overallRisk: null,
      chronicDistance21: null,
      chronicHighVelocity21: null,
      chronicMechImpacts21: null,
      ratioDistance21: null,
      ratioHighVelocity21: null,
      ratioMechImpacts21: null,
      riskDistance21: null,
      riskHighVelocity21: null,
      riskMechImpacts21: null,
      overallRisk21: null,
      weeksAvailable: foundCount,
    };
  }

  // ─── CÁLCULO ACWR ───────────────────────────────────────────────
  // Acute = valor de la semana actual (slot[0])
  const acuteDistance = currentSlot.totalDistance;
  const acuteHighVelocity = currentSlot.highVelocity;
  const acuteMechImpacts = currentSlot.mechanicalImpacts;

  // Chronic = (S_actual + S_n-1 + S_n-2 + S_n-3) / 4
  // SIEMPRE /4. Semanas sin datos = 0 (ya están como 0 en slots[]).
  const chronicDistance28 =
    (slots[0].totalDistance + slots[1].totalDistance + slots[2].totalDistance + slots[3].totalDistance) / 4;
  const chronicHighVelocity28 =
    (slots[0].highVelocity + slots[1].highVelocity + slots[2].highVelocity + slots[3].highVelocity) / 4;
  const chronicMechImpacts28 =
    (slots[0].mechanicalImpacts + slots[1].mechanicalImpacts + slots[2].mechanicalImpacts + slots[3].mechanicalImpacts) / 4;

  // Ratio = Acute / Chronic
  // Si Chronic = 0 → null (NaN/Infinity protection)
  const computeRatio = (acute: number, chronic: number): number | null => {
    if (chronic === 0) return null;
    const ratio = acute / chronic;
    if (!Number.isFinite(ratio)) return null;
    return +ratio.toFixed(2);
  };

  const ratioDistance28 = computeRatio(acuteDistance, chronicDistance28);
  const ratioHighVelocity28 = computeRatio(acuteHighVelocity, chronicHighVelocity28);
  const ratioMechImpacts28 = computeRatio(acuteMechImpacts, chronicMechImpacts28);

  const riskDistance = classifyRisk(ratioDistance28);
  const riskHighVelocity = classifyRisk(ratioHighVelocity28);
  const riskMechImpacts = classifyRisk(ratioMechImpacts28);
  const overallRisk = worstRisk([riskDistance, riskHighVelocity, riskMechImpacts]);

  // ─── CÁLCULO ACWR 21 DÍAS ───────────────────────────────────────────────
  const chronicDistance21 = (slots[0].totalDistance + slots[1].totalDistance + slots[2].totalDistance) / 3;
  const chronicHighVelocity21 = (slots[0].highVelocity + slots[1].highVelocity + slots[2].highVelocity) / 3;
  const chronicMechImpacts21 = (slots[0].mechanicalImpacts + slots[1].mechanicalImpacts + slots[2].mechanicalImpacts) / 3;

  const ratioDistance21 = computeRatio(acuteDistance, chronicDistance21);
  const ratioHighVelocity21 = computeRatio(acuteHighVelocity, chronicHighVelocity21);
  const ratioMechImpacts21 = computeRatio(acuteMechImpacts, chronicMechImpacts21);

  const riskDistance21 = classifyRisk(ratioDistance21);
  const riskHighVelocity21 = classifyRisk(ratioHighVelocity21);
  const riskMechImpacts21 = classifyRisk(ratioMechImpacts21);
  const overallRisk21 = worstRisk([riskDistance21, riskHighVelocity21, riskMechImpacts21]);

  return {
    playerId,
    playerName,
    position,
    currentWeek: {
      totalDistance: acuteDistance,
      highVelocity: acuteHighVelocity,
      mechanicalImpacts: acuteMechImpacts,
    },
    acuteDistance,
    chronicDistance28,
    acuteHighVelocity,
    chronicHighVelocity28,
    acuteMechImpacts,
    chronicMechImpacts28,
    ratioDistance28,
    ratioHighVelocity28,
    ratioMechImpacts28,
    riskDistance,
    riskHighVelocity,
    riskMechImpacts,
    overallRisk,
    chronicDistance21,
    chronicHighVelocity21,
    chronicMechImpacts21,
    ratioDistance21,
    ratioHighVelocity21,
    ratioMechImpacts21,
    riskDistance21,
    riskHighVelocity21,
    riskMechImpacts21,
    overallRisk21,
    weeksAvailable: foundCount,
  };
}

/**
 * Compute ACWR for ALL players for a given week/year.
 */
export async function computeAllPlayersACWR(
  year: number,
  week: number,
): Promise<PlayerAcwr[]> {
  const players = await prisma.player.findMany({ orderBy: { name: "asc" } });

  const results = await Promise.all(
    players.map((p) =>
      computePlayerACWR(p.id, p.name, p.position, year, week),
    ),
  );

  return results;
}

/**
 * Get available weeks (year/week pairs) that have weekly_stats data.
 */
export async function getAvailableWeeks(): Promise<
  { year: number; weekNumber: number }[]
> {
  const raw = await prisma.weeklyStat.findMany({
    select: { year: true, weekNumber: true },
    distinct: ["year", "weekNumber"],
    orderBy: [{ year: "desc" }, { weekNumber: "desc" }],
  });

  return raw;
}

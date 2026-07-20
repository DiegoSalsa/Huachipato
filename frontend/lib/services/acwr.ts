import { prisma } from "@/lib/prisma";

import type { Squad } from "@/lib/squads";

//
// Calculadora ACS de carga aguda y cronica
//
// Formulas usadas por la planilla del club con denominador fijo:
//   Carga aguda = valor de la semana actual
//   Carga cronica 28 dias = promedio de la semana actual y las tres previas
//
// Regla principal: siempre dividir por 4, aunque falten semanas con datos.
// Las semanas sin datos cuentan como 0, igual que en la planilla Excel.
//
// Ratios calculados:
//   1. A:C distancia 28 dias
//   2. A:C alta velocidad 28 dias
//   3. A:C impactos mecanicos 28 dias
//

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
  
  // Metricas de 21 dias, equivalentes a 3 semanas
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

//
// Clasifica el ratio ACS segun zona de riesgo.
//
export function classifyRisk(ratio: number | null): AcwrRisk | null {
  if (ratio === null || ratio === undefined) return null;
  if (ratio < 0.8) return "bajo";
  if (ratio <= 1.3) return "optimo";
  if (ratio <= 1.5) return "cuidado";
  return "alto";
}

//
// Obtiene el mayor nivel de riesgo entre varias metricas.
//
function worstRisk(risks: (AcwrRisk | null)[]): AcwrRisk | null {
  const validRisks = risks.filter((r): r is AcwrRisk => r !== null);
  if (validRisks.length === 0) return null;

  const priority: AcwrRisk[] = ["alto", "bajo", "cuidado", "optimo"];
  for (const level of priority) {
    if (validRisks.includes(level)) return level;
  }
  return "optimo";
}

//
// Construye las 4 semanas usadas para el calculo, actual mas tres previas.
// Las semanas faltantes se completan con valores en cero.
// Esto asegura la division fija por 4 usada por el club.
//
async function getWeeklyStats4Slots(
  playerId: string,
  year: number,
  week: number,
) {
  // Construir las cuatro combinaciones ano y semana hacia atras
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

  // Obtener los datos existentes
  const stats = await prisma.weeklyStat.findMany({
    where: {
      playerId,
      OR: weekPairs.map((wp) => ({
        year: wp.year,
        weekNumber: wp.weekNumber,
      })),
    },
  });

  // Construir arreglo fijo de cuatro semanas
  // Semanas faltantes se completan con cero
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

//
// Calcula ACS para un jugador en una semana y ano determinados.
//
// FÓRMULA EXACTA (sin excepciones):
//   Carga aguda = valor de S_actual
//   Carga cronica = (S_actual + S_n-1 + S_n-2 + S_n-3) / 4
//   Ratio  = Acute / Chronic
//
// Si una semana no existe en la DB -> su valor es 0.
// SIEMPRE dividir por 4.
// Si Chronic = 0 -> ratio = null (se muestra "Sin datos" en la UI).
//
export async function computePlayerACWR(
  playerId: string,
  playerName: string,
  position: string,
  year: number,
  week: number,
): Promise<PlayerAcwr> {
  const { slots, foundCount } = await getWeeklyStats4Slots(playerId, year, week);

  // Verificar si el jugador tiene datos en la semana consultada
  const currentSlot = slots[0]; // S_actual
  const currentWeekHasData = foundCount > 0 && (
    currentSlot.totalDistance > 0 ||
    currentSlot.highVelocity > 0 ||
    currentSlot.mechanicalImpacts > 0
  );

  // Si la semana actual no tiene datos, no se calcula ratio.
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

  // Calculo ACS
  // Carga aguda = valor de la semana actual.
  const acuteDistance = currentSlot.totalDistance;
  const acuteHighVelocity = currentSlot.highVelocity;
  const acuteMechImpacts = currentSlot.mechanicalImpacts;

  // Carga cronica = promedio fijo de cuatro semanas.
  // Siempre se divide por 4. Las semanas sin datos ya estan como cero.
  const chronicDistance28 =
    (slots[0].totalDistance + slots[1].totalDistance + slots[2].totalDistance + slots[3].totalDistance) / 4;
  const chronicHighVelocity28 =
    (slots[0].highVelocity + slots[1].highVelocity + slots[2].highVelocity + slots[3].highVelocity) / 4;
  const chronicMechImpacts28 =
    (slots[0].mechanicalImpacts + slots[1].mechanicalImpacts + slots[2].mechanicalImpacts + slots[3].mechanicalImpacts) / 4;

  // Ratio = carga aguda / carga cronica.
  // Si la carga cronica es cero, se retorna null.
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

  // CÁLCULO ACWR 21 DÍAS
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

//
// Calcula ACS para todos los jugadores en una semana y ano determinados.
//
export async function computeAllPlayersACWR(
  year: number,
  week: number,
  squad: Squad,
): Promise<PlayerAcwr[]> {
  const players = await prisma.player.findMany({
    where: { squad },
    orderBy: { name: "asc" },
  });

  const results = await Promise.all(
    players.map((p) =>
      computePlayerACWR(p.id, p.name, p.position, year, week),
    ),
  );

  return results;
}

//
// Obtiene las semanas disponibles con estadisticas cargadas.
//
export async function getAvailableWeeks(squad: Squad): Promise<
  { year: number; weekNumber: number }[]
> {
  const raw = await prisma.weeklyStat.findMany({
    where: { player: { squad } },
    select: { year: true, weekNumber: true },
    distinct: ["year", "weekNumber"],
    orderBy: [{ year: "desc" }, { weekNumber: "desc" }],
  });

  return raw;
}

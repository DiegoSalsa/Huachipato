import { prisma } from "@/backend/lib/db";

type MedicalInput = {
  playerId: string | number;
  date: string;
  weight?: string | number | null;
  height?: string | number | null;
  fatPct?: string | number | null;
  musclePct?: string | number | null;
  jumpCMJ?: string | number | null;
  sprint10m?: string | number | null;
  status?: string;
  notes?: string;
};

export async function listMedicalRecords(playerId?: number) {
  const where: { playerId?: number } = {};
  if (typeof playerId === "number" && Number.isFinite(playerId)) {
    where.playerId = playerId;
  }

  return prisma.medicalRecord.findMany({
    where,
    include: { player: true },
    orderBy: { date: "desc" },
  });
}

function parseOptionalFloat(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : null;
}

export async function createMedicalRecord(input: MedicalInput) {
  const parsedPlayerId = parseInt(String(input.playerId), 10);
  if (!Number.isFinite(parsedPlayerId)) {
    throw new Error("INVALID_PLAYER_ID");
  }

  return prisma.medicalRecord.create({
    data: {
      playerId: parsedPlayerId,
      date: new Date(input.date),
      weight: parseOptionalFloat(input.weight),
      height: parseOptionalFloat(input.height),
      fatPct: parseOptionalFloat(input.fatPct),
      musclePct: parseOptionalFloat(input.musclePct),
      jumpCMJ: parseOptionalFloat(input.jumpCMJ),
      sprint10m: parseOptionalFloat(input.sprint10m),
      status: input.status || "Estable",
      notes: input.notes || "",
    },
  });
}

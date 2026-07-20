export const SQUADS = [
  "PROFESIONAL",
  "SUB_20",
  "SUB_18",
  "SUB_17",
  "SUB_16",
  "SUB_15",
] as const;

export type Squad = (typeof SQUADS)[number];

export const SQUAD_LABELS: Record<Squad, string> = {
  PROFESIONAL: "Plantel Profesional",
  SUB_20: "Sub 20",
  SUB_18: "Sub 18",
  SUB_17: "Sub 17",
  SUB_16: "Sub 16",
  SUB_15: "Sub 15",
};

export function isSquad(value: unknown): value is Squad {
  return typeof value === "string" && SQUADS.includes(value as Squad);
}

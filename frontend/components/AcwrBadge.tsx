"use client";

import type { AcwrRisk } from "@/lib/services/acwr";

const riskConfig: Record<
  string,
  { label: string; bg: string; text: string; dot: string; border: string }
> = {
  bajo: {
    label: "Bajo",
    bg: "bg-sky-100",
    text: "text-sky-700",
    dot: "bg-sky-500",
    border: "border-sky-200",
  },
  optimo: {
    label: "Óptimo",
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    border: "border-emerald-200",
  },
  cuidado: {
    label: "Cuidado",
    bg: "bg-amber-100",
    text: "text-amber-700",
    dot: "bg-amber-500",
    border: "border-amber-200",
  },
  alto: {
    label: "Alto Riesgo",
    bg: "bg-rose-100",
    text: "text-rose-700",
    dot: "bg-rose-500",
    border: "border-rose-200",
  },
};

interface AcwrBadgeProps {
  risk: AcwrRisk | null;
  ratio?: number | null;
  size?: "sm" | "md";
}

export default function AcwrBadge({ risk, ratio, size = "md" }: AcwrBadgeProps) {
  if (!risk) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500">
        Sin datos
      </span>
    );
  }

  const config = riskConfig[risk];
  const isSmall = size === "sm";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full ${config.bg} ${config.text} ${
        isSmall ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]"
      } font-bold`}
    >
      <span className={`size-1.5 rounded-full ${config.dot}`} />
      {ratio !== undefined && ratio !== null ? `${ratio.toFixed(2)} · ` : ""}
      {config.label}
    </span>
  );
}

export function getRiskCellClass(risk: AcwrRisk | null): string {
  if (!risk) return "";
  return riskConfig[risk]?.border ?? "";
}

export function getRiskDotClass(risk: AcwrRisk | null): string {
  if (!risk) return "bg-slate-300";
  return riskConfig[risk]?.dot ?? "bg-slate-300";
}

export { riskConfig };

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import AcwrBadge, { riskConfig } from "@/components/AcwrBadge";
import HuachipatoLoader from "@/components/HuachipatoLoader";
import { generateACSReport, loadLogoBase64 } from "@/lib/report-generator";

type AcwrRisk = "bajo" | "optimo" | "cuidado" | "alto";

interface PlayerAcwr {
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
  ratioDistance28: number | null;
  ratioHighVelocity28: number | null;
  ratioMechImpacts28: number | null;
  riskDistance: AcwrRisk | null;
  riskHighVelocity: AcwrRisk | null;
  riskMechImpacts: AcwrRisk | null;
  overallRisk: AcwrRisk | null;

  // 21 days metrics
  ratioDistance21: number | null;
  ratioHighVelocity21: number | null;
  ratioMechImpacts21: number | null;
  riskDistance21: AcwrRisk | null;
  riskHighVelocity21: AcwrRisk | null;
  riskMechImpacts21: AcwrRisk | null;
  overallRisk21: AcwrRisk | null;

  weeksAvailable: number;
}

interface AcwrResponse {
  players: PlayerAcwr[];
  week: number;
  year: number;
  availableWeeks: { year: number; weekNumber: number }[];
}

const positionLabels: Record<string, string> = {
  PORTERO: "Portero",
  DEFENSA: "Defensa",
  MEDIOCAMPISTA: "Mediocampista",
  DELANTERO: "Delantero",
};

const filterButtons = [
  { key: "all", icon: "group", label: "Todos", classes: "bg-slate-100 border-transparent" },
  { key: "optimo", icon: "check_circle", label: "Óptimo", classes: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { key: "cuidado", icon: "warning", label: "Cuidado", classes: "bg-amber-50 text-amber-700 border-amber-200" },
  { key: "alto", icon: "error", label: "Alto Riesgo", classes: "bg-rose-50 text-rose-700 border-rose-200" },
  { key: "bajo", icon: "ac_unit", label: "Bajo", classes: "bg-sky-50 text-sky-700 border-sky-200" },
];

function RatioCell({ ratio, risk }: { ratio: number | null; risk: AcwrRisk | null }) {
  if (ratio === null) {
    return <span className="text-slate-400">—</span>;
  }

  const config = risk ? riskConfig[risk] : null;
  return (
    <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-sm font-bold ${config ? `${config.bg} ${config.text}` : "bg-slate-50 text-slate-600"}`}>
      <span className={`size-1.5 rounded-full ${config?.dot ?? "bg-slate-300"}`} />
      {ratio.toFixed(2)}
    </span>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<AcwrResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedWeek, setSelectedWeek] = useState<string>("");
  const [period, setPeriod] = useState<"28" | "21">("28");
  const [generating, setGenerating] = useState(false);
  const logoRef = useRef<string>("");

  const loadData = useCallback(async (weekParam?: string) => {
    setLoading(true);
    const url = weekParam ? `/api/acwr?${weekParam}` : "/api/acwr";
    const res = await fetch(url);
    const json: AcwrResponse = await res.json();
    setData(json);
    setLoading(false);
    return json;
  }, []);

  useEffect(() => {
    void loadData().then((json) => {
      if (json?.year && json?.week) {
        setSelectedWeek(`${json.year}-${json.week}`);
      }
    });
  }, [loadData]);

  // Preload logo for PDF generation
  useEffect(() => {
    loadLogoBase64().then((b64) => { logoRef.current = b64; });
  }, []);

  const handleDownloadPDF = async () => {
    if (!data || generating) return;
    setGenerating(true);
    try {
      await generateACSReport({
        players: data.players,
        week: data.week,
        year: data.year,
        period,
        logoBase64: logoRef.current,
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleWeekChange = (value: string) => {
    setSelectedWeek(value);
    const [year, week] = value.split("-");
    void loadData(`year=${year}&week=${week}`);
  };

  const players = data?.players ?? [];

  const getRisk = (p: PlayerAcwr) => period === "28" ? p.overallRisk : p.overallRisk21;

  const counts = {
    all: players.length,
    optimo: players.filter((p) => getRisk(p) === "optimo").length,
    cuidado: players.filter((p) => getRisk(p) === "cuidado").length,
    alto: players.filter((p) => getRisk(p) === "alto").length,
    bajo: players.filter((p) => getRisk(p) === "bajo").length,
  };

  const filtered =
    activeFilter === "all"
      ? players
      : players.filter((p) => getRisk(p) === activeFilter);

  return (
    <div className="flex flex-col bg-white min-h-full">
        {/* Header */}
        <header className="border-b border-slate-200 bg-white px-4 py-5 md:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900">
                Monitor ACS
              </h1>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Ratio Carga Aguda:Crónica del plantel ·{" "}
                {data ? `Semana ${data.week}, ${data.year}` : "Cargando..."}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
              {/* Week Selector */}
              {data && data.availableWeeks.length > 0 && (
                <div className="relative">
                  <select
                    value={selectedWeek}
                    onChange={(e) => handleWeekChange(e.target.value)}
                    className="appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-4 pr-9 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-[#0085CB] focus:ring-2 focus:ring-[#0085CB]/20"
                  >
                    {data.availableWeeks.map((w) => (
                      <option key={`${w.year}-${w.weekNumber}`} value={`${w.year}-${w.weekNumber}`}>
                        S{w.weekNumber} · {w.year}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-base">
                    expand_more
                  </span>
                </div>
              )}
              {/* Period Selector */}
              <div className="relative">
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value as "28" | "21")}
                  className="appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-4 pr-9 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-[#0085CB] focus:ring-2 focus:ring-[#0085CB]/20"
                >
                  <option value="28">28 Días (4 Sem)</option>
                  <option value="21">21 Días (3 Sem)</option>
                </select>
                <span className="material-symbols-outlined pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-base">
                  expand_more
                </span>
              </div>
              <Link
                href="/ingesta"
                className="inline-flex items-center gap-2 rounded-lg bg-[#0085CB] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                <span className="material-symbols-outlined text-base">upload_file</span>
                Subir CSV
              </Link>
              <button
                onClick={handleDownloadPDF}
                disabled={generating || !data || players.length === 0}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className={`material-symbols-outlined text-base ${generating ? 'animate-spin' : ''}`}>
                  {generating ? 'progress_activity' : 'picture_as_pdf'}
                </span>
                {generating ? 'Generando...' : 'Descargar PDF'}
              </button>
            </div>
          </div>
        </header>

        <div className="space-y-6 p-4 md:p-8 overflow-hidden">
          {/* KPI Cards */}
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-5">
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Jugadores
              </p>
              <p className="mt-1 text-3xl font-black text-slate-900">{counts.all}</p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">
                Óptimo
              </p>
              <p className="mt-1 text-3xl font-black text-emerald-700">{counts.optimo}</p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-amber-700">
                Cuidado
              </p>
              <p className="mt-1 text-3xl font-black text-amber-700">{counts.cuidado}</p>
            </div>
            <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-rose-700">
                Alto Riesgo
              </p>
              <p className="mt-1 text-3xl font-black text-rose-700">{counts.alto}</p>
            </div>
            <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-sky-700">
                Bajo
              </p>
              <p className="mt-1 text-3xl font-black text-sky-700">{counts.bajo}</p>
            </div>
          </section>

          {/* Filter Buttons */}
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {filterButtons.map((f) => (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={`flex min-w-max items-center gap-2 rounded-xl border px-4 py-2 transition-all ${f.classes} ${
                  activeFilter === f.key ? "ring-2 ring-[#0085CB]/30" : ""
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{f.icon}</span>
                <span className="text-sm font-bold">
                  {f.label} ({counts[f.key as keyof typeof counts]})
                </span>
              </button>
            ))}
          </div>

          {/* ACWR Table */}
          {loading ? (
            <HuachipatoLoader />
          ) : players.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <span className="material-symbols-outlined text-6xl text-slate-300">sports_soccer</span>
              <h3 className="mt-4 text-xl font-bold text-slate-400">Sin datos ACS</h3>
              <p className="mt-1 text-sm text-slate-400">
                Sube un CSV o ejecuta el seeder para comenzar.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-4">
                <h2 className="text-lg font-bold text-slate-900">
                  Tabla ACS del Plantel
                </h2>
                <p className="text-xs font-medium text-slate-500">
                  Ratios calculados con fórmula de carga crónica {period} días · Semáforo de riesgo
                </p>
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-100 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-600">
                    <tr>
                      <th className="px-5 py-3 whitespace-nowrap">Jugador</th>
                      <th className="px-5 py-3 whitespace-nowrap">Posición</th>
                      <th className="px-5 py-3 whitespace-nowrap text-right">Dist. Semanal</th>
                      <th className="px-5 py-3 whitespace-nowrap text-center">A:C Distancia</th>
                      <th className="px-5 py-3 whitespace-nowrap text-center">A:C Alta Vel.</th>
                      <th className="px-5 py-3 whitespace-nowrap text-center">A:C Impactos</th>
                      <th className="px-5 py-3 whitespace-nowrap text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((player) => (
                      <tr
                        key={player.playerId}
                        className="transition-colors hover:bg-slate-50/50"
                      >
                        <td className="px-5 py-3.5">
                          <Link
                            href={`/jugadores/${player.playerId}`}
                            className="font-semibold text-slate-900 hover:text-[#0085CB] transition-colors"
                          >
                            {player.playerName}
                          </Link>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600">
                          {positionLabels[player.position] ?? player.position}
                        </td>
                        <td className="px-5 py-3.5 text-right font-medium text-slate-700">
                          {player.currentWeek
                            ? `${(player.currentWeek.totalDistance / 1000).toFixed(1)} km`
                            : "—"}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <RatioCell ratio={period === "28" ? player.ratioDistance28 : player.ratioDistance21} risk={period === "28" ? player.riskDistance : player.riskDistance21} />
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <RatioCell ratio={period === "28" ? player.ratioHighVelocity28 : player.ratioHighVelocity21} risk={period === "28" ? player.riskHighVelocity : player.riskHighVelocity21} />
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <RatioCell ratio={period === "28" ? player.ratioMechImpacts28 : player.ratioMechImpacts21} risk={period === "28" ? player.riskMechImpacts : player.riskMechImpacts21} />
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <AcwrBadge risk={getRisk(player)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-slate-100">
                {filtered.map((player) => (
                  <Link
                    key={player.playerId}
                    href={`/jugadores/${player.playerId}`}
                    className="block p-4 hover:bg-slate-50/50 transition-colors active:bg-slate-100"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold text-slate-900">{player.playerName}</p>
                        <p className="text-xs text-slate-500">{positionLabels[player.position] ?? player.position}</p>
                      </div>
                      <AcwrBadge risk={getRisk(player)} />
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Dist. Semanal</span>
                        <span className="font-bold text-slate-700">
                          {player.currentWeek ? `${(player.currentWeek.totalDistance / 1000).toFixed(1)} km` : "—"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">A:C Dist.</span>
                        <RatioCell ratio={period === "28" ? player.ratioDistance28 : player.ratioDistance21} risk={period === "28" ? player.riskDistance : player.riskDistance21} />
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">A:C Alta Vel.</span>
                        <RatioCell ratio={period === "28" ? player.ratioHighVelocity28 : player.ratioHighVelocity21} risk={period === "28" ? player.riskHighVelocity : player.riskHighVelocity21} />
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">A:C Impactos</span>
                        <RatioCell ratio={period === "28" ? player.ratioMechImpacts28 : player.ratioMechImpacts21} risk={period === "28" ? player.riskMechImpacts : player.riskMechImpacts21} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
              Guía de Semáforo ACS
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-sky-500" />
                <span className="text-xs font-medium text-slate-600">{"< 0.80 — Bajo (subentrenamiento)"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-emerald-500" />
                <span className="text-xs font-medium text-slate-600">0.80 – 1.30 — Óptimo</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-amber-500" />
                <span className="text-xs font-medium text-slate-600">1.31 – 1.50 — Cuidado</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-rose-500" />
                <span className="text-xs font-medium text-slate-600">{"> 1.50 — Alto Riesgo (sobrecarga)"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}

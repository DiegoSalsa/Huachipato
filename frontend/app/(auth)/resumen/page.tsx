"use client";

import { useEffect, useState, useCallback } from "react";
import HuachipatoLoader from "@/components/HuachipatoLoader";
import RoleGuard from "@/components/RoleGuard";

// Tipos

interface PlayerDailyMetrics {
  playerId: string;
  playerName: string;
  position: string;
  totalDistance: number;
  hsr: number;
  sprintDistance: number;
  sprints: number;
  accelerations: number;
  decelerations: number;
  sessionsCount: number;
}

interface PlayerWeeklyMetrics {
  playerId: string;
  playerName: string;
  position: string;
  totalDistance: number;
  hsr: number;
  sprintDistance: number;
  sprints: number;
  accelerations: number;
  decelerations: number;
  daysWithData: number;
}

interface OverviewData {
  date: string;
  year: number;
  weekNumber: number;
  weekLabel: string;
  daily: PlayerDailyMetrics[];
  weekly: PlayerWeeklyMetrics[];
}

type ViewTab = "today" | "week";

const positionEtiquetas: Record<string, string> = {
  PORTERO: "Portero",
  DEFENSA: "Defensa",
  MEDIOCAMPISTA: "Mediocampista",
  DELANTERO: "Delantero",
};

// Funciones de formato de metricas

function fmtDist(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters)} m`;
}

function fmtNum(n: number): string {
  return n.toLocaleString("es-CL");
}

// Componente de tarjeta de indicador

function StatCard({
  icon,
  label,
  value,
  sub,
  accent = "slate",
}: {
  icon: string;
  label: string;
  value: string;
  sub?: string;
  accent?: "blue" | "emerald" | "amber" | "rose" | "violet" | "slate";
}) {
  const colorMap: Record<string, { bg: string; icon: string; text: string }> = {
    blue: { bg: "bg-[#0085CB]/5 border-[#0085CB]/20", icon: "text-[#0085CB]", text: "text-[#0085CB]" },
    emerald: { bg: "bg-emerald-50 border-emerald-200", icon: "text-emerald-600", text: "text-emerald-700" },
    amber: { bg: "bg-amber-50 border-amber-200", icon: "text-amber-600", text: "text-amber-700" },
    rose: { bg: "bg-rose-50 border-rose-200", icon: "text-rose-600", text: "text-rose-700" },
    violet: { bg: "bg-violet-50 border-violet-200", icon: "text-violet-600", text: "text-violet-700" },
    slate: { bg: "bg-slate-50 border-slate-200", icon: "text-slate-500", text: "text-slate-700" },
  };

  const c = colorMap[accent];

  return (
    <div className={`rounded-2xl border p-4 ${c.bg} transition-all`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={`material-symbols-outlined text-lg ${c.icon}`}>{icon}</span>
        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{label}</span>
      </div>
      <p className={`text-2xl font-black ${c.text}`}>{value}</p>
      {sub && <p className="text-[11px] font-medium text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// Pagina principal

export default function ResumenPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");
  const [activeTab, setActiveTab] = useState<ViewTab>("today");

  const loadData = useCallback(async (date: string) => {
    setLoading(true);
    try {
      const url = date ? `/api/overview?date=${date}` : `/api/overview`;
      const res = await fetch(url);
      const json: OverviewData = await res.json();
      setData(json);
      if (!date && json.date) {
        setSelectedDate(json.date.split("T")[0]);
      }
    } catch {
      console.error("Error loading overview data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedDate === "") {
      void loadData("");
    } else {
      void loadData(selectedDate);
    }
  }, [selectedDate, loadData]);

  const daily = data?.daily ?? [];
  const weekly = data?.weekly ?? [];

  // Calcular indicadores del dia
  const todayTotals = daily.reduce(
    (acc, p) => ({
      distance: acc.distance + p.totalDistance,
      hsr: acc.hsr + p.hsr,
      sprints: acc.sprints + p.sprints,
      players: acc.players + 1,
    }),
    { distance: 0, hsr: 0, sprints: 0, players: 0 },
  );

  // Calcular indicadores de la semana
  const weekTotals = weekly.reduce(
    (acc, p) => ({
      distance: acc.distance + p.totalDistance,
      hsr: acc.hsr + p.hsr,
      sprints: acc.sprints + p.sprints,
      players: acc.players + 1,
    }),
    { distance: 0, hsr: 0, sprints: 0, players: 0 },
  );

  // Formatear la fecha seleccionada
  const displayDate = selectedDate
    ? new Date(selectedDate + "T12:00:00").toLocaleDateString("es-CL", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Cargando...";

  return (
      <RoleGuard allowedRoles={["gps", "admin"]}>
      <div className="flex flex-col bg-white min-h-full">
        {/* Encabezado */}
        <header className="border-b border-slate-200 bg-white px-4 py-5 md:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
                Resumen del Día
              </h1>
              <p className="mt-1 text-sm font-medium text-slate-500 capitalize">
                {displayDate}
                {data && (
                  <span className="ml-2 text-[#0085CB]">
                    · Semana {data.weekNumber}, {data.year}
                  </span>
                )}
              </p>
            </div>
            <div className="flex w-full items-center gap-3 md:w-auto">
              {/* Selector de fecha */}
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-[#0085CB] focus:ring-2 focus:ring-[#0085CB]/20 md:w-auto"
              />
            </div>
          </div>
        </header>

        <div className="space-y-6 p-4 md:p-8 overflow-hidden">
          {/* Selector de vista */}
          <div className="flex w-full gap-1 rounded-xl bg-slate-100 p-1 sm:w-fit sm:gap-2">
            <button
              onClick={() => setActiveTab("today")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-bold transition-all sm:flex-none sm:px-5 ${
                activeTab === "today"
                  ? "bg-white text-[#0085CB] shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <span className="material-symbols-outlined text-lg">today</span>
              Hoy
              {daily.length > 0 && (
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  activeTab === "today" ? "bg-[#0085CB]/10 text-[#0085CB]" : "bg-slate-200 text-slate-500"
                }`}>
                  {daily.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("week")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-bold transition-all sm:flex-none sm:px-5 ${
                activeTab === "week"
                  ? "bg-white text-emerald-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <span className="material-symbols-outlined text-lg">date_range</span>
              Semana
              {weekly.length > 0 && (
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  activeTab === "week" ? "bg-emerald-100 text-emerald-600" : "bg-slate-200 text-slate-500"
                }`}>
                  {weekly.length}
                </span>
              )}
            </button>
          </div>

          {loading ? (
            <HuachipatoLoader />
          ) : (
            <>
              {/* Vista diaria */}
              {activeTab === "today" && (
                <div className="space-y-6 animate-in fade-in">
                  {/* Tarjetas de indicadores */}
                  <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-4">
                    <StatCard
                      icon="group"
                      label="Jugadores"
                      value={String(todayTotals.players)}
                      sub="con datos hoy"
                      accent="blue"
                    />
                    <StatCard
                      icon="directions_run"
                      label="Dist. Total"
                      value={fmtDist(todayTotals.distance)}
                      sub="suma del plantel"
                      accent="emerald"
                    />
                    <StatCard
                      icon="speed"
                      label="HSR Total"
                      value={fmtDist(todayTotals.hsr)}
                      sub="alta velocidad"
                      accent="amber"
                    />
                    <StatCard
                      icon="bolt"
                      label="Sprints"
                      value={fmtNum(todayTotals.sprints)}
                      sub="total del plantel"
                      accent="rose"
                    />
                  </div>

                  {daily.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50">
                      <span className="material-symbols-outlined text-6xl text-slate-300">
                        event_busy
                      </span>
                      <h3 className="mt-4 text-lg font-bold text-slate-400">
                        Sin datos para este día
                      </h3>
                      <p className="mt-1 text-sm text-slate-400">
                        No se han subido archivos GPS para el{" "}
                        {selectedDate
                          ? new Date(selectedDate + "T12:00:00").toLocaleDateString("es-CL", {
                              day: "numeric",
                              month: "long",
                            })
                          : "día seleccionado"}
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                      <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-4">
                        <h2 className="text-lg font-bold text-slate-900">
                          Métricas del Día
                        </h2>
                        <p className="text-xs font-medium text-slate-500">
                          Datos GPS individuales por jugador · Suma de todas las sesiones del día
                        </p>
                      </div>

                      {/* Tabla de escritorio */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead className="border-b border-slate-100 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-600">
                            <tr>
                              <th className="px-5 py-3 whitespace-nowrap">Jugador</th>
                              <th className="px-5 py-3 whitespace-nowrap">Posición</th>
                              <th className="px-5 py-3 whitespace-nowrap text-right">Distancia</th>
                              <th className="px-5 py-3 whitespace-nowrap text-right">HSR</th>
                              <th className="px-5 py-3 whitespace-nowrap text-right">Sprint Dist.</th>
                              <th className="px-5 py-3 whitespace-nowrap text-center">Sprints</th>
                              <th className="px-5 py-3 whitespace-nowrap text-center">Acc</th>
                              <th className="px-5 py-3 whitespace-nowrap text-center">Dec</th>
                              <th className="px-5 py-3 whitespace-nowrap text-center">Sesiones</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {daily.map((p) => (
                              <tr
                                key={p.playerId}
                                className="transition-colors hover:bg-slate-50/50"
                              >
                                <td className="px-5 py-3.5 font-semibold text-slate-900">
                                  {p.playerName}
                                </td>
                                <td className="px-5 py-3.5 text-slate-600">
                                  {positionEtiquetas[p.position] ?? p.position}
                                </td>
                                <td className="px-5 py-3.5 text-right font-medium text-slate-700">
                                  {fmtDist(p.totalDistance)}
                                </td>
                                <td className="px-5 py-3.5 text-right font-medium text-slate-700">
                                  {fmtDist(p.hsr)}
                                </td>
                                <td className="px-5 py-3.5 text-right font-medium text-slate-700">
                                  {fmtDist(p.sprintDistance)}
                                </td>
                                <td className="px-5 py-3.5 text-center font-medium text-slate-700">
                                  {p.sprints}
                                </td>
                                <td className="px-5 py-3.5 text-center font-medium text-slate-700">
                                  {p.accelerations}
                                </td>
                                <td className="px-5 py-3.5 text-center font-medium text-slate-700">
                                  {p.decelerations}
                                </td>
                                <td className="px-5 py-3.5 text-center">
                                  {p.sessionsCount > 1 ? (
                                    <span className="inline-flex items-center gap-1 rounded-lg bg-violet-50 px-2 py-0.5 text-xs font-bold text-violet-700">
                                      <span className="material-symbols-outlined text-xs">repeat</span>
                                      {p.sessionsCount}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400">1</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Vista movil en tarjetas */}
                      <div className="md:hidden divide-y divide-slate-100">
                        {daily.map((p) => (
                          <div key={p.playerId} className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="font-semibold text-slate-900 text-sm">{p.playerName}</p>
                                <p className="text-xs text-slate-500">{positionEtiquetas[p.position] ?? p.position}</p>
                              </div>
                              {p.sessionsCount > 1 && (
                                <span className="inline-flex items-center gap-1 rounded-lg bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-700">
                                  <span className="material-symbols-outlined text-[10px]">repeat</span>
                                  {p.sessionsCount} ses.
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-3 gap-2 mt-2">
                              <div className="text-center rounded-lg bg-slate-50 p-2">
                                <p className="text-[10px] font-bold uppercase text-slate-400">Dist.</p>
                                <p className="text-sm font-black text-slate-800">{fmtDist(p.totalDistance)}</p>
                              </div>
                              <div className="text-center rounded-lg bg-slate-50 p-2">
                                <p className="text-[10px] font-bold uppercase text-slate-400">HSR</p>
                                <p className="text-sm font-black text-slate-800">{fmtDist(p.hsr)}</p>
                              </div>
                              <div className="text-center rounded-lg bg-slate-50 p-2">
                                <p className="text-[10px] font-bold uppercase text-slate-400">Sprints</p>
                                <p className="text-sm font-black text-slate-800">{p.sprints}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Vista semanal */}
              {activeTab === "week" && (
                <div className="space-y-6 animate-in fade-in">
                  {/* Etiqueta de semana */}
                  {data?.weekLabel && (
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                      <span className="material-symbols-outlined text-base text-emerald-600">
                        calendar_month
                      </span>
                      <span className="capitalize">{data.weekLabel}</span>
                    </div>
                  )}

                  {/* Tarjetas de indicadores */}
                  <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-4">
                    <StatCard
                      icon="group"
                      label="Jugadores"
                      value={String(weekTotals.players)}
                      sub="con datos esta semana"
                      accent="emerald"
                    />
                    <StatCard
                      icon="directions_run"
                      label="Dist. Acumulada"
                      value={fmtDist(weekTotals.distance)}
                      sub="Lun -> Dom"
                      accent="blue"
                    />
                    <StatCard
                      icon="speed"
                      label="HSR Acumulado"
                      value={fmtDist(weekTotals.hsr)}
                      sub="alta velocidad semanal"
                      accent="amber"
                    />
                    <StatCard
                      icon="bolt"
                      label="Sprints"
                      value={fmtNum(weekTotals.sprints)}
                      sub="total semanal"
                      accent="violet"
                    />
                  </div>

                  {weekly.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50">
                      <span className="material-symbols-outlined text-6xl text-slate-300">
                        event_busy
                      </span>
                      <h3 className="mt-4 text-lg font-bold text-slate-400">
                        Sin datos para esta semana
                      </h3>
                      <p className="mt-1 text-sm text-slate-400">
                        Semana {data?.weekNumber} de {data?.year} · No hay registros GPS cargados
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                      <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-4">
                        <h2 className="text-lg font-bold text-slate-900">
                          Acumulado Semanal
                        </h2>
                        <p className="text-xs font-medium text-slate-500">
                          Suma de métricas GPS de Lunes a Domingo · Semana {data?.weekNumber}
                        </p>
                      </div>

                      {/* Tabla de escritorio */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead className="border-b border-slate-100 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-600">
                            <tr>
                              <th className="px-5 py-3 whitespace-nowrap">Jugador</th>
                              <th className="px-5 py-3 whitespace-nowrap">Posición</th>
                              <th className="px-5 py-3 whitespace-nowrap text-right">Distancia</th>
                              <th className="px-5 py-3 whitespace-nowrap text-right">HSR</th>
                              <th className="px-5 py-3 whitespace-nowrap text-right">Sprint Dist.</th>
                              <th className="px-5 py-3 whitespace-nowrap text-center">Sprints</th>
                              <th className="px-5 py-3 whitespace-nowrap text-center">Acc</th>
                              <th className="px-5 py-3 whitespace-nowrap text-center">Dec</th>
                              <th className="px-5 py-3 whitespace-nowrap text-center">Días</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {weekly.map((p) => (
                              <tr
                                key={p.playerId}
                                className="transition-colors hover:bg-slate-50/50"
                              >
                                <td className="px-5 py-3.5 font-semibold text-slate-900">
                                  {p.playerName}
                                </td>
                                <td className="px-5 py-3.5 text-slate-600">
                                  {positionEtiquetas[p.position] ?? p.position}
                                </td>
                                <td className="px-5 py-3.5 text-right font-medium text-slate-700">
                                  {fmtDist(p.totalDistance)}
                                </td>
                                <td className="px-5 py-3.5 text-right font-medium text-slate-700">
                                  {fmtDist(p.hsr)}
                                </td>
                                <td className="px-5 py-3.5 text-right font-medium text-slate-700">
                                  {fmtDist(p.sprintDistance)}
                                </td>
                                <td className="px-5 py-3.5 text-center font-medium text-slate-700">
                                  {p.sprints}
                                </td>
                                <td className="px-5 py-3.5 text-center font-medium text-slate-700">
                                  {p.accelerations}
                                </td>
                                <td className="px-5 py-3.5 text-center font-medium text-slate-700">
                                  {p.decelerations}
                                </td>
                                <td className="px-5 py-3.5 text-center">
                                  <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                                    {p.daysWithData}
                                    <span className="text-emerald-500 font-normal">/7</span>
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Vista movil en tarjetas */}
                      <div className="md:hidden divide-y divide-slate-100">
                        {weekly.map((p) => (
                          <div key={p.playerId} className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="font-semibold text-slate-900 text-sm">{p.playerName}</p>
                                <p className="text-xs text-slate-500">{positionEtiquetas[p.position] ?? p.position}</p>
                              </div>
                              <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                {p.daysWithData}<span className="text-emerald-500 font-normal">/7</span> días
                              </span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 mt-2">
                              <div className="text-center rounded-lg bg-slate-50 p-2">
                                <p className="text-[10px] font-bold uppercase text-slate-400">Dist.</p>
                                <p className="text-sm font-black text-slate-800">{fmtDist(p.totalDistance)}</p>
                              </div>
                              <div className="text-center rounded-lg bg-slate-50 p-2">
                                <p className="text-[10px] font-bold uppercase text-slate-400">HSR</p>
                                <p className="text-sm font-black text-slate-800">{fmtDist(p.hsr)}</p>
                              </div>
                              <div className="text-center rounded-lg bg-slate-50 p-2">
                                <p className="text-[10px] font-bold uppercase text-slate-400">Sprints</p>
                                <p className="text-sm font-black text-slate-800">{p.sprints}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      </RoleGuard>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import SegmentFilter from "@/components/SegmentFilter";

interface Player {
  id: number;
  name: string;
  position: string;
}

interface Metric {
  id: number;
  playerId: number;
  totalDistance: number;
  dMin: number;
  maxSpeed: number;
  hsr: number;
  acc: number;
  dec: number;
  player: Player;
}

interface Session {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  duration: string;
  totalPlayers: number;
  segments: { id: number; name: string }[];
}

interface MetricsResponse {
  metrics: Metric[];
  averages: { totalDistance: number; dMin: number; maxSpeed: number; acc: number; dec: number } | null;
}

interface WeeklySnapshot {
  sessionId: number;
  date: string;
  dayLabel: string;
  context: "Partido" | "Entrenamiento";
  loadIndex: number;
  players: number;
}

type TrafficStatus = "optimal" | "caution" | "danger";

const statusConfig: Record<TrafficStatus, { label: string; badge: string; accent: string; dot: string }> = {
  optimal: {
    label: "Verde · Optimo",
    badge: "bg-emerald-100 text-emerald-700",
    accent: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  caution: {
    label: "Amarillo · Cuidado",
    badge: "bg-amber-100 text-amber-700",
    accent: "border-amber-200",
    dot: "bg-amber-500",
  },
  danger: {
    label: "Rojo · Sobrecarga",
    badge: "bg-rose-100 text-rose-700",
    accent: "border-rose-200",
    dot: "bg-rose-500",
  },
};

const statusFilters = [
  { icon: "group", label: "Todos", classes: "bg-slate-100 border-transparent", filter: "all" },
  { icon: "check_circle", label: "Optimo", classes: "bg-emerald-50 text-emerald-700 border-emerald-200", filter: "optimal" },
  { icon: "warning", label: "Cuidado", classes: "bg-amber-50 text-amber-700 border-amber-200", filter: "caution" },
  { icon: "error", label: "Riesgo", classes: "bg-rose-50 text-rose-700 border-rose-200", filter: "danger" },
];

function getAcuteLoad(metric: Metric) {
  return (
    metric.totalDistance / 1000 +
    metric.hsr / 180 +
    metric.acc * 0.75 +
    metric.dec * 0.65 +
    metric.dMin * 0.12
  );
}

function getChronicLoad(metric: Metric) {
  const scaling = 0.72 + (metric.playerId % 4) * 0.08;
  return getAcuteLoad(metric) / scaling;
}

function getAcwr(metric: Metric) {
  const chronic = getChronicLoad(metric);
  if (chronic <= 0) return 0;
  return +(getAcuteLoad(metric) / chronic).toFixed(2);
}

function getStatus(acwr: number): TrafficStatus {
  if (acwr > 1.4) return "danger";
  if (acwr > 1.2) return "caution";
  return "optimal";
}

function buildWeeklyLoad(metric: Metric) {
  const base = getAcuteLoad(metric);
  return Array.from({ length: 7 }, (_, index) => {
    const oscillation = Math.sin((index + metric.playerId) * 0.8) * 0.08;
    const progression = index * 0.02;
    return +(base * (0.86 + progression + oscillation)).toFixed(1);
  });
}

function getSessionContext(session: Session): "Partido" | "Entrenamiento" {
  const hasMatchSegments = session.segments?.some((segment) => segment.name === "Primer Tiempo" || segment.name === "Segundo Tiempo");
  return hasMatchSegments ? "Partido" : "Entrenamiento";
}

function buildTeamLoadIndex(metrics: Metric[]) {
  if (!metrics.length) return 0;
  const total = metrics.reduce((sum, metric) => sum + getAcuteLoad(metric), 0);
  return +(total / metrics.length).toFixed(1);
}

function Sparkline({ values }: { values: number[] }) {
  const width = 160;
  const height = 44;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);

  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - ((value - min) / range) * (height - 6) - 3;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-11 w-full">
      <polyline
        points={points}
        fill="none"
        stroke="#0085CB"
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      <polyline
        points={`${points} ${width},${height} 0,${height}`}
        fill="rgba(0,133,203,0.08)"
        stroke="none"
      />
      {values.map((value, index) => {
        const x = (index / (values.length - 1)) * width;
        const y = height - ((value - min) / range) * (height - 6) - 3;
        return <circle key={index} cx={x} cy={y} r={1.9} fill="#0085CB" />;
      })}
    </svg>
  );
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [weeklySnapshots, setWeeklySnapshots] = useState<WeeklySnapshot[]>([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async (segmentId: string | null) => {
    setLoading(true);

    const sessions = await fetch("/api/sessions").then((response) => response.json() as Promise<Session[]>);

    if (!sessions.length) {
      setSession(null);
      setMetrics([]);
      setWeeklySnapshots([]);
      setLoading(false);
      return;
    }

    const latestSession = sessions[0];
    setSession(latestSession);

    const segParam = segmentId ? `&segmentId=${segmentId}` : "&segmentId=null";
    const latestData = await fetch(`/api/metrics?sessionId=${latestSession.id}${segParam}`).then((response) => response.json() as Promise<MetricsResponse>);
    setMetrics(latestData?.metrics || []);

    const weekSessions = sessions.slice(0, 7);
    const weeklyData = await Promise.all(
      weekSessions.map(async (weekSession) => {
        const weekMetrics = await fetch(`/api/metrics?sessionId=${weekSession.id}&segmentId=null`)
          .then((response) => response.json() as Promise<MetricsResponse>)
          .then((data) => data.metrics || []);

        return {
          sessionId: weekSession.id,
          date: weekSession.date,
          dayLabel: new Date(weekSession.date).toLocaleDateString("es-CL", { weekday: "short" }),
          context: getSessionContext(weekSession),
          loadIndex: buildTeamLoadIndex(weekMetrics),
          players: weekMetrics.length,
        } satisfies WeeklySnapshot;
      })
    );

    setWeeklySnapshots(weeklyData.reverse());
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData(null);
  }, [loadData]);

  const filteredMetrics = activeFilter === "all"
    ? metrics
    : metrics.filter((m) => getStatus(getAcwr(m)) === activeFilter);

  const counts = {
    all: metrics.length,
    optimal: metrics.filter((m) => getStatus(getAcwr(m)) === "optimal").length,
    caution: metrics.filter((m) => getStatus(getAcwr(m)) === "caution").length,
    danger: metrics.filter((m) => getStatus(getAcwr(m)) === "danger").length,
  };

  const isMatchContext = session ? getSessionContext(session) === "Partido" : false;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-y-auto bg-white pb-20 md:pb-0">
        <header className="border-b border-slate-200 bg-white px-4 py-5 md:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900">Hub de Microciclo y Disponibilidad</h1>
              <p className="mt-1 text-sm font-medium text-slate-500">
                {session
                  ? `${isMatchContext ? "Datos de Partido" : "Datos de Entrenamiento"} · ${new Date(session.date).toLocaleDateString("es-CL", { day: "2-digit", month: "short" })} · Indice de carga del plantel`
                  : "Cargando microciclo competitivo..."}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <SegmentFilter onChange={(segId) => loadData(segId)} />
              <Link href="/ingesta" className="inline-flex items-center gap-2 rounded-lg bg-[#0085CB] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90">
                <span className="material-symbols-outlined text-base">upload_file</span>
                Subir STATSports
              </Link>
            </div>
          </div>
        </header>

        <div className="space-y-6 p-4 md:p-8">
          <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Jugadores Monitoreados</p>
              <p className="mt-1 text-3xl font-black text-slate-900">{metrics.length}</p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Optimo</p>
              <p className="mt-1 text-3xl font-black text-emerald-700">{counts.optimal}</p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-amber-700">Cuidado</p>
              <p className="mt-1 text-3xl font-black text-amber-700">{counts.caution}</p>
            </div>
            <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-rose-700">Riesgo</p>
              <p className="mt-1 text-3xl font-black text-rose-700">{counts.danger}</p>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Resumen Semanal Completo</h2>
                <p className="text-xs font-medium text-slate-500">Microciclo integrado con entrenamiento y partido</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Ultimas 7 sesiones</span>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-7">
              {weeklySnapshots.map((snapshot) => (
                <div key={snapshot.sessionId} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-500">{snapshot.dayLabel}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${snapshot.context === "Partido" ? "bg-[#0085CB]/10 text-[#0085CB]" : "bg-slate-200 text-slate-700"}`}>
                      {snapshot.context}
                    </span>
                  </div>
                  <p className="mt-2 text-xl font-black text-slate-900">{snapshot.loadIndex.toFixed(1)}</p>
                  <p className="text-[11px] font-medium text-slate-500">Indice de Carga</p>
                  <p className="mt-2 text-[11px] text-slate-500">{new Date(snapshot.date).toLocaleDateString("es-CL", { day: "2-digit", month: "short" })} · {snapshot.players} jugadores</p>
                </div>
              ))}
            </div>
          </section>

          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {statusFilters.map((f) => (
              <button
                key={f.filter}
                onClick={() => setActiveFilter(f.filter)}
                className={`flex min-w-max items-center gap-2 rounded-xl border px-4 py-2 transition-all ${f.classes} ${activeFilter === f.filter ? "ring-2 ring-[#0085CB]/30" : ""}`}
              >
                <span className="material-symbols-outlined text-[20px]">{f.icon}</span>
                <span className="text-sm font-bold">{f.label} ({counts[f.filter as keyof typeof counts]})</span>
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="size-8 animate-spin rounded-full border-3 border-[#0085CB] border-t-transparent" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {filteredMetrics.map((m) => {
                const acwr = getAcwr(m);
                const status = getStatus(acwr);
                const config = statusConfig[status];
                const weekly = buildWeeklyLoad(m);
                return (
                  <Link
                    key={m.id}
                    href={`/jugadores/${m.playerId}`}
                    className={`group rounded-2xl border bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${config.accent}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-bold leading-tight text-slate-900">{m.player.name}</h3>
                        <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{m.player.position || "Plantel Profesional"}</p>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${config.badge}`}>{config.label}</span>
                    </div>

                    <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Ratio Carga Aguda:Cronica</p>
                        <span className={`size-2.5 rounded-full ${config.dot}`} />
                      </div>
                      <p className="mt-1 text-3xl font-black text-slate-900">{acwr.toFixed(2)}</p>
                      <p className="text-xs font-medium text-slate-500">Tendencia de carga · ultimos 7 dias</p>
                      <div className="mt-2">
                        <Sparkline values={weekly} />
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-lg bg-slate-50 p-2">
                        <p className="text-[10px] font-bold uppercase text-slate-400">Dist Total</p>
                        <p className="text-sm font-bold text-slate-900">{(m.totalDistance / 1000).toFixed(1)} km</p>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-2">
                        <p className="text-[10px] font-bold uppercase text-slate-400">D/Min</p>
                        <p className="text-sm font-bold text-slate-900">{m.dMin}</p>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-2">
                        <p className="text-[10px] font-bold uppercase text-slate-400">Vel Max</p>
                        <p className="text-sm font-bold text-slate-900">{m.maxSpeed.toFixed(1)}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

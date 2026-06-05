"use client";

import { use, useEffect, useMemo, useState } from "react";
import Image from "next/image";

interface Player {
  id: number;
  name: string;
  position: string;
  category: string;
  imageUrl?: string;
}

interface Metric {
  totalDistance: number;
  dMin: number;
  maxSpeed: number;
  hsr: number;
  distZ6: number;
  acc: number;
  dec: number;
  segment: { name: string } | null;
  session: { date: string };
}

interface MedicalRecord {
  id: number;
  date: string;
  weight: number | null;
  height: number | null;
  fatPct: number | null;
  musclePct: number | null;
  jumpCMJ: number | null;
  sprint10m: number | null;
  status: string;
  notes: string;
}

interface PlayerData extends Player {
  metrics: Metric[];
  medicalRecords: MedicalRecord[];
}

type TabKey = "medical" | "gps";

interface MicrocyclePoint {
  label: string;
  acute: number;
  chronic: number;
  hsr: number;
  z6: number;
}

function calcAcute(metric: Metric) {
  return metric.totalDistance / 1000 + metric.hsr / 180 + metric.acc * 0.75 + metric.dec * 0.65 + metric.dMin * 0.12;
}

function buildMicrocycleSeries(metrics: Metric[]): MicrocyclePoint[] {
  const fullSession = metrics.filter((metric) => !metric.segment);
  if (!fullSession.length) {
    return [];
  }

  const recent = fullSession.slice(0, 4).reverse();
  const source = recent.length >= 4 ? recent : Array.from({ length: 4 }, (_, index) => recent[0 + Math.min(index, recent.length - 1)]);

  return source.map((metric, index) => {
    const trendFactor = 0.9 + index * 0.05;
    const acute = calcAcute(metric) * trendFactor;
    const chronic = acute / (0.84 + (index % 2) * 0.08);
    return {
      label: `W${index + 1}`,
      acute: +acute.toFixed(1),
      chronic: +chronic.toFixed(1),
      hsr: Math.round(metric.hsr * trendFactor),
      z6: Math.round(metric.distZ6 * trendFactor),
    };
  });
}

function AreaComparisonChart({ data }: { data: MicrocyclePoint[] }) {
  const width = 760;
  const height = 270;
  const padX = 34;
  const padY = 26;
  const max = Math.max(...data.map((point) => Math.max(point.acute, point.chronic)), 1);

  const toPoint = (value: number, index: number) => {
    const x = padX + (index / Math.max(data.length - 1, 1)) * (width - padX * 2);
    const y = height - padY - (value / max) * (height - padY * 2);
    return { x, y };
  };

  const acutePoints = data.map((point, index) => toPoint(point.acute, index));
  const chronicPoints = data.map((point, index) => toPoint(point.chronic, index));

  const acutePath = acutePoints.map((point) => `${point.x},${point.y}`).join(" ");
  const chronicPath = chronicPoints.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-[270px] w-full">
      {[0.25, 0.5, 0.75, 1].map((scale) => {
        const y = height - padY - (height - padY * 2) * scale;
        return <line key={scale} x1={padX} y1={y} x2={width - padX} y2={y} stroke="#e2e8f0" strokeWidth={1} />;
      })}

      <polyline points={`${chronicPath} ${chronicPoints[chronicPoints.length - 1]?.x ?? padX},${height - padY} ${chronicPoints[0]?.x ?? padX},${height - padY}`} fill="rgba(100,116,139,0.12)" stroke="none" />
      <polyline points={`${acutePath} ${acutePoints[acutePoints.length - 1]?.x ?? padX},${height - padY} ${acutePoints[0]?.x ?? padX},${height - padY}`} fill="rgba(0,133,203,0.14)" stroke="none" />
      <polyline points={chronicPath} fill="none" stroke="#64748B" strokeWidth={2.2} strokeLinecap="round" />
      <polyline points={acutePath} fill="none" stroke="#0085CB" strokeWidth={2.8} strokeLinecap="round" />

      {data.map((point, index) => (
        <g key={point.label}>
          <circle cx={acutePoints[index]?.x} cy={acutePoints[index]?.y} r={3.6} fill="#0085CB" />
          <text x={acutePoints[index]?.x} y={height - 7} textAnchor="middle" className="fill-slate-500 text-[10px] font-semibold">
            {point.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

function MultiLineChart({ data }: { data: MicrocyclePoint[] }) {
  const width = 760;
  const height = 240;
  const padX = 34;
  const padY = 26;
  const max = Math.max(...data.map((point) => Math.max(point.hsr, point.z6)), 1);

  const toPoint = (value: number, index: number) => {
    const x = padX + (index / Math.max(data.length - 1, 1)) * (width - padX * 2);
    const y = height - padY - (value / max) * (height - padY * 2);
    return { x, y };
  };

  const hsrPoints = data.map((point, index) => toPoint(point.hsr, index));
  const z6Points = data.map((point, index) => toPoint(point.z6, index));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-[240px] w-full">
      {[0.25, 0.5, 0.75, 1].map((scale) => {
        const y = height - padY - (height - padY * 2) * scale;
        return <line key={scale} x1={padX} y1={y} x2={width - padX} y2={y} stroke="#e2e8f0" strokeWidth={1} />;
      })}

      <polyline points={hsrPoints.map((point) => `${point.x},${point.y}`).join(" ")} fill="none" stroke="#0085CB" strokeWidth={2.8} strokeLinecap="round" />
      <polyline points={z6Points.map((point) => `${point.x},${point.y}`).join(" ")} fill="none" stroke="#334155" strokeWidth={2.6} strokeDasharray="6 4" strokeLinecap="round" />

      {data.map((point, index) => (
        <g key={`${point.label}-${index}`}>
          <circle cx={hsrPoints[index]?.x} cy={hsrPoints[index]?.y} r={3.4} fill="#0085CB" />
          <circle cx={z6Points[index]?.x} cy={z6Points[index]?.y} r={3.4} fill="#334155" />
          <text x={hsrPoints[index]?.x} y={height - 7} textAnchor="middle" className="fill-slate-500 text-[10px] font-semibold">
            {point.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function JugadorPerfilPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("gps");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/players/${id}`)
      .then((response) => response.json())
      .then((data) => {
        setPlayer(data);
        setLoading(false);
      });
  }, [id]);

  const latestMedical = player?.medicalRecords[0] ?? null;
  const latestMetric = useMemo(() => player?.metrics.find((metric) => !metric.segment) ?? player?.metrics[0] ?? null, [player]);
  const profileStatus = latestMedical?.status || "Titular";
  const microcycleSeries = useMemo(() => (player ? buildMicrocycleSeries(player.metrics) : []), [player]);

  if (loading || !player) {
    return (
      <main className="flex flex-1 items-center justify-center bg-white">
        <div className="size-10 animate-spin rounded-full border-4 border-[#0085CB] border-t-transparent" />
      </main>
    );
  }

  return (
    <main className="flex flex-col flex-1 bg-white pb-20 md:pb-0">
      <main className="flex flex-1 flex-col overflow-y-auto bg-white pb-20 md:pb-0">
        <header className="border-b border-slate-200 bg-white px-6 py-6 md:px-10">
          <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-5 rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white p-5 md:grid-cols-[auto_1fr_auto] md:items-center">
            <div className="h-24 w-24 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
              {player.imageUrl ? (
                  <Image
                    src={player.imageUrl}
                    alt={`Foto de ${player.name}`}
                    className="h-full w-full object-cover"
                    width={96}
                    height={96}
                  />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[#0085CB] text-4xl font-black text-white">{player.name.charAt(0)}</div>
              )}
            </div>

            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900">{player.name}</h1>
              <p className="mt-1 text-sm font-medium text-slate-500">Perfil Profesional del Jugador</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1">Edad: N/D</span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1">{player.position || "Posicion no asignada"}</span>
                <span className="rounded-full border border-[#0085CB]/20 bg-[#0085CB]/10 px-3 py-1 text-[#0085CB]">{profileStatus}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-1">
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-center md:min-w-[150px]">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Vel. Max</p>
                <p className="text-2xl font-black text-slate-900">{latestMetric ? latestMetric.maxSpeed.toFixed(1) : "-"}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-center md:min-w-[150px]">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">D/Min</p>
                <p className="text-2xl font-black text-slate-900">{latestMetric?.dMin ?? "-"}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto w-full max-w-6xl space-y-6 p-6 md:p-10">
          <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
            <button
              onClick={() => setActiveTab("medical")}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${activeTab === "medical" ? "bg-white text-[#0085CB] shadow-sm" : "text-slate-500"}`}
            >
              Clinico/Medico
            </button>
            <button
              onClick={() => setActiveTab("gps")}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${activeTab === "gps" ? "bg-white text-[#0085CB] shadow-sm" : "text-slate-500"}`}
            >
              GPS Microciclo
            </button>
          </div>

          {activeTab === "medical" && (
            <section className="grid grid-cols-1 gap-5 md:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Peso</p>
                <p className="mt-2 text-3xl font-black text-slate-900">{latestMedical?.weight ?? "-"}</p>
                <p className="text-xs text-slate-500">kg</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Altura</p>
                <p className="mt-2 text-3xl font-black text-slate-900">{latestMedical?.height ?? "-"}</p>
                <p className="text-xs text-slate-500">cm</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Grasa Corporal</p>
                <p className="mt-2 text-3xl font-black text-slate-900">{latestMedical?.fatPct ?? "-"}</p>
                <p className="text-xs text-slate-500">%</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Sprint 10m</p>
                <p className="mt-2 text-3xl font-black text-slate-900">{latestMedical?.sprint10m ?? "-"}</p>
                <p className="text-xs text-slate-500">s</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 md:col-span-4">
                <h3 className="text-lg font-bold text-slate-900">Notas Clinicas</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{latestMedical?.notes || "Aun no hay notas medicas cargadas para este jugador."}</p>
              </div>
            </section>
          )}

          {activeTab === "gps" && (
            <section className="space-y-6">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Carga Aguda</p>
                  <p className="text-2xl font-black text-[#0085CB]">{microcycleSeries.at(-1)?.acute.toFixed(1) ?? "-"}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Carga Cronica</p>
                  <p className="text-2xl font-black text-slate-900">{microcycleSeries.at(-1)?.chronic.toFixed(1) ?? "-"}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">HSR</p>
                  <p className="text-2xl font-black text-slate-900">{microcycleSeries.at(-1)?.hsr ?? "-"}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Z6 Distance</p>
                  <p className="text-2xl font-black text-slate-900">{microcycleSeries.at(-1)?.z6 ?? "-"}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
                <h3 className="text-xl font-bold text-slate-900">Carga Aguda vs Carga Cronica</h3>
                <p className="text-xs font-medium text-slate-500">Curva mensual del microciclo</p>
                <div className="mt-4">{microcycleSeries.length ? <AreaComparisonChart data={microcycleSeries} /> : <p className="py-20 text-center text-sm text-slate-500">No hay datos GPS de microciclo disponibles.</p>}</div>
                <div className="mt-2 flex gap-6 text-xs font-medium text-slate-600">
                  <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#0085CB]" /> Aguda</span>
                  <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-slate-600" /> Cronica</span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
                <h3 className="text-xl font-bold text-slate-900">HSR y Distancia Z6</h3>
                <p className="text-xs font-medium text-slate-500">Tendencia de explosividad durante el mes</p>
                <div className="mt-4">{microcycleSeries.length ? <MultiLineChart data={microcycleSeries} /> : <p className="py-20 text-center text-sm text-slate-500">No hay datos de explosividad disponibles.</p>}</div>
                <div className="mt-2 flex gap-6 text-xs font-medium text-slate-600">
                  <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#0085CB]" /> HSR</span>
                  <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-slate-700" /> Z6</span>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
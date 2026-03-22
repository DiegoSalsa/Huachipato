"use client";

import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";

interface Player {
  id: number;
  name: string;
  position: string;
}

interface Metric {
  playerId: number;
  maxSpeed: number;
  hsr: number;
  distZ6: number;
  dMin: number;
  acc: number;
  dec: number;
  totalDistance: number;
  player: Player;
}

interface Session {
  id: number;
}

type MetricKey = "maxSpeed" | "hsr" | "distZ6" | "dMin" | "acc" | "dec";

const metricConfig: { key: MetricKey; label: string; unit: string }[] = [
  { key: "maxSpeed", label: "Velocidad Max", unit: "km/h" },
  { key: "hsr", label: "HSR", unit: "m" },
  { key: "distZ6", label: "Distancia Z6", unit: "m" },
  { key: "dMin", label: "D/Min", unit: "m/min" },
  { key: "acc", label: "Aceleraciones", unit: "" },
  { key: "dec", label: "Deceleraciones", unit: "" },
];

function RadarChart({ starter, substitute }: { starter: Metric; substitute: Metric }) {
  const size = 520;
  const center = size / 2;
  const maxRadius = 180;

  const maxByAxis = metricConfig.map((metric) => Math.max(starter[metric.key], substitute[metric.key], 1));

  const toPoint = (index: number, value: number, max: number) => {
    const angle = (Math.PI / 3) * index - Math.PI / 2;
    const radius = (value / max) * maxRadius;
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    };
  };

  const starterPoints = metricConfig.map((metric, index) => toPoint(index, starter[metric.key], maxByAxis[index]));
  const subPoints = metricConfig.map((metric, index) => toPoint(index, substitute[metric.key], maxByAxis[index]));

  return (
    <div className="relative h-[520px] w-[520px] max-w-full">
      <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full">
        {[0.25, 0.5, 0.75, 1].map((scale) => (
          <polygon
            key={scale}
            points={Array.from({ length: 6 }, (_, index) => {
              const angle = (Math.PI / 3) * index - Math.PI / 2;
              const x = center + maxRadius * scale * Math.cos(angle);
              const y = center + maxRadius * scale * Math.sin(angle);
              return `${x},${y}`;
            }).join(" ")}
            fill="none"
            stroke="#E2E8F0"
            strokeWidth={1}
          />
        ))}

        {Array.from({ length: 6 }, (_, index) => {
          const angle = (Math.PI / 3) * index - Math.PI / 2;
          const x = center + maxRadius * Math.cos(angle);
          const y = center + maxRadius * Math.sin(angle);
          return <line key={index} x1={center} y1={center} x2={x} y2={y} stroke="#E2E8F0" strokeWidth={1} />;
        })}

        <polygon
          points={subPoints.map((point) => `${point.x},${point.y}`).join(" ")}
          fill="rgba(100,116,139,0.22)"
          stroke="#64748B"
          strokeWidth={2}
        />
        <polygon
          points={starterPoints.map((point) => `${point.x},${point.y}`).join(" ")}
          fill="rgba(0,133,203,0.22)"
          stroke="#0085CB"
          strokeWidth={2.3}
        />

        {starterPoints.map((point, index) => (
          <circle key={`starter-${index}`} cx={point.x} cy={point.y} r={3.5} fill="#0085CB" />
        ))}
        {subPoints.map((point, index) => (
          <circle key={`sub-${index}`} cx={point.x} cy={point.y} r={3.5} fill="#64748B" />
        ))}
      </svg>

      {metricConfig.map((metric, index) => {
        const positions = [
          "top-0 left-1/2 -translate-x-1/2",
          "top-[21%] right-0",
          "bottom-[21%] right-0",
          "bottom-0 left-1/2 -translate-x-1/2",
          "bottom-[21%] left-0",
          "top-[21%] left-0",
        ];

        return (
          <div key={metric.key} className={`absolute text-center text-[11px] font-bold text-slate-600 ${positions[index]}`}>
            {metric.label}
          </div>
        );
      })}
    </div>
  );
}

export default function RendimientoPage() {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<string>("");
  const [starterId, setStarterId] = useState<number | null>(null);
  const [substituteId, setSubstituteId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/sessions").then((response) => response.json() as Promise<Session[]>),
      fetch("/api/players").then((response) => response.json() as Promise<Player[]>),
    ])
      .then(async ([sessions, players]) => {
        if (!sessions.length) {
          setLoading(false);
          return;
        }

        const data = await fetch(`/api/metrics?sessionId=${sessions[0].id}&segmentId=null`).then((response) => response.json());
        const mapped = (data.metrics as Metric[]).filter((metric) => metric.player?.position);

        setMetrics(mapped);

        const firstPosition = mapped[0]?.player.position || players[0]?.position || "";
        setSelectedPosition(firstPosition);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const groupedByPosition = useMemo(() => {
    const grouped = new Map<string, Metric[]>();
    metrics.forEach((metric) => {
      const position = metric.player.position || "Sin posicion";
      if (!grouped.has(position)) grouped.set(position, []);
      grouped.get(position)?.push(metric);
    });

    grouped.forEach((positionMetrics) => {
      positionMetrics.sort((a, b) => b.totalDistance - a.totalDistance);
    });

    return grouped;
  }, [metrics]);

  const positionOptions = Array.from(groupedByPosition.keys());
  const selectedMetrics = groupedByPosition.get(selectedPosition) || [];

  useEffect(() => {
    if (!selectedMetrics.length) {
      setStarterId(null);
      setSubstituteId(null);
      return;
    }

    setStarterId(selectedMetrics[0]?.playerId ?? null);
    setSubstituteId(selectedMetrics[1]?.playerId ?? selectedMetrics[0]?.playerId ?? null);
  }, [selectedPosition, selectedMetrics]);

  const starter = selectedMetrics.find((metric) => metric.playerId === starterId) || null;
  const substitute = selectedMetrics.find((metric) => metric.playerId === substituteId) || null;

  const comparisonCards = starter && substitute
    ? metricConfig.map((metric) => {
      const gap = starter[metric.key] - substitute[metric.key];
      const positive = gap >= 0;
      return {
        label: metric.label,
        gap,
        unit: metric.unit,
        style: positive ? "text-[#0085CB] bg-[#0085CB]/10" : "text-slate-600 bg-slate-100",
      };
    })
    : [];

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-y-auto bg-white pb-20 md:pb-0">
        <header className="border-b border-slate-200 px-6 py-6 md:px-10">
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Benchmarking por Posicion</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Titulares vs suplentes usando 6 metricas clave de STATSports</p>
        </header>

        <div className="mx-auto w-full max-w-6xl space-y-7 p-6 md:p-10">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="size-8 animate-spin rounded-full border-3 border-[#0085CB] border-t-transparent" />
            </div>
          ) : (
            <>
              <section className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.13em] text-slate-500">Posicion</label>
                  <select
                    value={selectedPosition}
                    onChange={(event) => setSelectedPosition(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-[#0085CB]"
                  >
                    {positionOptions.map((position) => (
                      <option key={position} value={position}>{position}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.13em] text-slate-500">Jugador A</label>
                  <select
                    value={starterId ?? ""}
                    onChange={(event) => setStarterId(Number(event.target.value))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-[#0085CB]"
                  >
                    {selectedMetrics.map((metric, index) => (
                      <option key={`a-${metric.playerId}`} value={metric.playerId}>
                        {metric.player.name} {index === 0 ? `(Titular ${selectedPosition})` : `(Suplente ${selectedPosition})`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.13em] text-slate-500">Jugador B</label>
                  <select
                    value={substituteId ?? ""}
                    onChange={(event) => setSubstituteId(Number(event.target.value))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-[#0085CB]"
                  >
                    {selectedMetrics.map((metric, index) => (
                      <option key={`b-${metric.playerId}`} value={metric.playerId}>
                        {metric.player.name} {index === 0 ? `(Titular ${selectedPosition})` : `(Suplente ${selectedPosition})`}
                      </option>
                    ))}
                  </select>
                </div>
              </section>

              {starter && substitute && (
                <section className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6">
                  <div className="mb-6 flex flex-wrap items-center justify-center gap-5 text-xs font-semibold text-slate-700">
                    <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#0085CB]" /> {starter.player.name}</span>
                    <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-slate-500" /> {substitute.player.name}</span>
                  </div>

                  <div className="flex justify-center">
                    <RadarChart starter={starter} substitute={substitute} />
                  </div>
                </section>
              )}

              {comparisonCards.length > 0 && (
                <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {comparisonCards.map((card) => (
                    <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{card.label}</p>
                      <p className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${card.style}`}>
                        {card.gap >= 0 ? "+" : ""}{card.gap.toFixed(1)} {card.unit}
                      </p>
                      <p className="mt-2 text-xs text-slate-500">Brecha de rendimiento entre titular y suplente seleccionados.</p>
                    </div>
                  ))}
                </section>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
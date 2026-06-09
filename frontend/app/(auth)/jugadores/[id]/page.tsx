"use client";

import { useEffect, useState, useCallback, useMemo, use, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import AcwrBadge, { riskConfig } from "@/components/AcwrBadge";
import HuachipatoLoader from "@/components/HuachipatoLoader";

interface HistoryPoint {
  year: number;
  weekNumber: number;
  label: string;
  acuteDistance: number;
  chronicDistance28: number;
  acuteHighVelocity: number;
  chronicHighVelocity28: number;
  acuteMechImpacts: number;
  chronicMechImpacts28: number;
  risk: string;
}

interface PlayerProfile {
  id: string;
  name: string;
  position: string;
  photo: string | null;
  history: HistoryPoint[];
}

function AreaComparisonChart({ data }: { data: HistoryPoint[] }) {
  const width = 760;
  const height = 270;
  const padX = 34;
  const padY = 26;
  const max = Math.max(...data.map((point) => Math.max(point.acuteDistance, point.chronicDistance28)), 1);

  const toPoint = (value: number, index: number) => {
    const x = padX + (index / Math.max(data.length - 1, 1)) * (width - padX * 2);
    const y = height - padY - (value / max) * (height - padY * 2);
    return { x, y };
  };

  const acutePoints = data.map((point, index) => toPoint(point.acuteDistance, index));
  const chronicPoints = data.map((point, index) => toPoint(point.chronicDistance28, index));

  const acutePath = acutePoints.map((point) => `${point.x},${point.y}`).join(" ");
  const chronicPath = chronicPoints.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      {[0.25, 0.5, 0.75, 1].map((scale) => {
        const y = height - padY - (height - padY * 2) * scale;
        return <line key={scale} x1={padX} y1={y} x2={width - padX} y2={y} stroke="#e2e8f0" strokeWidth={1} />;
      })}

      {data.length > 1 && (
        <>
          <polyline points={`${chronicPath} ${chronicPoints[chronicPoints.length - 1]?.x ?? padX},${height - padY} ${chronicPoints[0]?.x ?? padX},${height - padY}`} fill="rgba(100,116,139,0.12)" stroke="none" />
          <polyline points={`${acutePath} ${acutePoints[acutePoints.length - 1]?.x ?? padX},${height - padY} ${acutePoints[0]?.x ?? padX},${height - padY}`} fill="rgba(0,133,203,0.14)" stroke="none" />
          <polyline points={chronicPath} fill="none" stroke="#64748B" strokeWidth={2.2} strokeLinecap="round" />
          <polyline points={acutePath} fill="none" stroke="#0085CB" strokeWidth={2.8} strokeLinecap="round" />
        </>
      )}

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

function DualAxisLineChart({ data }: { data: HistoryPoint[] }) {
  const width = 760;
  const height = 240;
  const padX = 34;
  const padY = 26;
  
  const maxHV = Math.max(...data.map((point) => point.acuteHighVelocity), 1);
  const maxImp = Math.max(...data.map((point) => point.acuteMechImpacts), 1);

  const toPointHV = (value: number, index: number) => {
    const x = padX + (index / Math.max(data.length - 1, 1)) * (width - padX * 2);
    const y = height - padY - (value / maxHV) * (height - padY * 2);
    return { x, y };
  };

  const toPointImp = (value: number, index: number) => {
    const x = padX + (index / Math.max(data.length - 1, 1)) * (width - padX * 2);
    const y = height - padY - (value / maxImp) * (height - padY * 2);
    return { x, y };
  };

  const hvPoints = data.map((point, index) => toPointHV(point.acuteHighVelocity, index));
  const impPoints = data.map((point, index) => toPointImp(point.acuteMechImpacts, index));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      {[0.25, 0.5, 0.75, 1].map((scale) => {
        const y = height - padY - (height - padY * 2) * scale;
        return <line key={scale} x1={padX} y1={y} x2={width - padX} y2={y} stroke="#e2e8f0" strokeWidth={1} />;
      })}

      {data.length > 1 && (
        <>
          <polyline points={hvPoints.map((point) => `${point.x},${point.y}`).join(" ")} fill="none" stroke="#0085CB" strokeWidth={2.8} strokeLinecap="round" />
          <polyline points={impPoints.map((point) => `${point.x},${point.y}`).join(" ")} fill="none" stroke="#334155" strokeWidth={2.6} strokeDasharray="6 4" strokeLinecap="round" />
        </>
      )}

      {data.map((point, index) => (
        <g key={`${point.label}-${index}`}>
          <circle cx={hvPoints[index]?.x} cy={hvPoints[index]?.y} r={3.4} fill="#0085CB" />
          <circle cx={impPoints[index]?.x} cy={impPoints[index]?.y} r={3.4} fill="#334155" />
          <text x={hvPoints[index]?.x} y={height - 7} textAnchor="middle" className="fill-slate-500 text-[10px] font-semibold">
            {point.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function JugadorPerfilPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/players/${id}`)
      .then((response) => response.json())
      .then((data) => {
        setPlayer(data);
        setLoading(false);
      });
  }, [id]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_SIZE = 200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        const webpDataUrl = canvas.toDataURL("image/webp", 0.8);

        fetch(`/api/players/${id}/photo`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photoBase64: webpDataUrl }),
        })
          .then((res) => res.json())
          .then((resData) => {
            if (resData.success && player) {
              setPlayer({ ...player, photo: resData.player.photo });
            }
          })
          .finally(() => setUploadingPhoto(false));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const positionLabels: Record<string, string> = {
    PORTERO: "Portero",
    DEFENSA: "Defensa",
    MEDIOCAMPISTA: "Mediocampista",
    DELANTERO: "Delantero",
  };

  if (loading || !player) {
    return (
      <main className="flex flex-1 items-center justify-center bg-white">
        {loading ? (
          <HuachipatoLoader />
        ) : !player ? (
          <p className="text-slate-500">Jugador no encontrado</p>
        ) : null}
      </main>
    );
  }

  const latest = player.history.length > 0 ? player.history[player.history.length - 1] : null;

  return (
    <div className="flex flex-col bg-white min-h-full">
        <header className="border-b border-slate-200 bg-white px-4 py-6 md:px-10">
          <div className="mx-auto w-full max-w-6xl">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#0085CB] hover:underline mb-4">
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Volver al Monitor ACWR
            </Link>
            
            <div className="rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white p-5">
              {/* Mobile: stack vertically. Desktop: horizontal grid */}
              <div className="flex flex-col gap-5 md:grid md:grid-cols-[auto_1fr_auto] md:items-center">
                <div 
                  className="relative h-20 w-20 md:h-24 md:w-24 overflow-hidden rounded-2xl border border-slate-200 bg-[#0085CB]/10 flex items-center justify-center cursor-pointer group shrink-0 mx-auto md:mx-0"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploadingPhoto ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-20">
                      <div className="size-6 animate-spin rounded-full border-2 border-[#0085CB] border-t-transparent" />
                    </div>
                  ) : null}
                  
                  {player.photo ? (
                    <img src={player.photo} alt={player.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-4xl md:text-5xl text-[#0085CB]">person</span>
                  )}
                  
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <span className="material-symbols-outlined text-white text-2xl">photo_camera</span>
                  </div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                  />
                </div>

                <div className="text-center md:text-left">
                  <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">{player.name}</h1>
                  <p className="mt-1 text-sm font-medium text-slate-500">Perfil Profesional de Rendimiento</p>
                  <div className="mt-3 flex flex-wrap items-center justify-center md:justify-start gap-2 text-xs font-semibold">
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                      {positionLabels[player.position] ?? player.position}
                    </span>
                    {latest && (
                      <AcwrBadge risk={latest.risk as any} />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 md:px-4 md:py-3 text-center md:min-w-[150px]">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Dist. Semanal</p>
                    <p className="text-xl md:text-2xl font-black text-slate-900">
                      {latest ? `${(latest.acuteDistance / 1000).toFixed(1)}km` : "-"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 md:px-4 md:py-3 text-center md:min-w-[150px]">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Impactos</p>
                    <p className="text-xl md:text-2xl font-black text-slate-900">{latest?.acuteMechImpacts ?? "-"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto w-full max-w-6xl space-y-6 p-4 md:p-10 overflow-hidden">
          <section className="space-y-6">
            <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-white p-3 md:p-4 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Carga Aguda (Dist)</p>
                <p className="text-xl md:text-2xl font-black text-[#0085CB]">
                  {latest ? `${(latest.acuteDistance / 1000).toFixed(1)}k` : "-"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3 md:p-4 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Carga Crónica (Dist)</p>
                <p className="text-xl md:text-2xl font-black text-slate-600">
                  {latest ? `${(latest.chronicDistance28 / 1000).toFixed(1)}k` : "-"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3 md:p-4 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">A:C Distancia</p>
                <p className="text-xl md:text-2xl font-black text-slate-900">
                  {latest && latest.chronicDistance28 > 0 ? (latest.acuteDistance / latest.chronicDistance28).toFixed(2) : "-"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3 md:p-4 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Semanas Registradas</p>
                <p className="text-xl md:text-2xl font-black text-emerald-600">{player.history.length}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm">
              <h3 className="text-lg md:text-xl font-bold text-slate-900">Carga Aguda vs Carga Crónica (Distancia)</h3>
              <p className="text-xs font-medium text-slate-500">Evolución histórica de volumen de trabajo</p>
              <div className="mt-4 w-full overflow-hidden">
                {player.history.length ? (
                  <AreaComparisonChart data={player.history} />
                ) : (
                  <p className="py-20 text-center text-sm text-slate-500">No hay datos ACWR disponibles.</p>
                )}
              </div>
              <div className="mt-2 flex justify-center gap-6 text-xs font-medium text-slate-600">
                <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#0085CB]" /> Aguda</span>
                <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-slate-500" /> Crónica (28d)</span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm">
              <h3 className="text-lg md:text-xl font-bold text-slate-900">Alta Velocidad vs Impactos Mecánicos</h3>
              <p className="text-xs font-medium text-slate-500">Métricas de intensidad pura (Escalas independientes)</p>
              <div className="mt-4 w-full overflow-hidden">
                {player.history.length ? (
                  <DualAxisLineChart data={player.history} />
                ) : (
                  <p className="py-20 text-center text-sm text-slate-500">No hay datos de intensidad disponibles.</p>
                )}
              </div>
              <div className="mt-2 flex justify-center gap-6 text-xs font-medium text-slate-600">
                <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#0085CB]" /> Alta Velocidad (m)</span>
                <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-slate-700" /> Impactos Mecánicos (n)</span>
              </div>
            </div>
          </section>
        </div>
    </div>
  );
}
"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Sidebar from "@/components/Sidebar";

interface UploadResult {
  success: boolean;
  sessionId: number;
  imported: number;
  columns: string[];
  preview: Record<string, unknown>[];
}

interface MetricRow {
  id: number;
  totalDistance: number;
  dMin: number;
  maxSpeed: number;
  hsr: number;
  distZ6: number;
  acc: number;
  dec: number;
  player: { name: string };
}

const trainingSegments = ["Sesion Completa", "Rondo", "Reducido"];
const matchSegments = ["Partido Completo", "Primer Tiempo", "Segundo Tiempo"];

function getMappedValue(row: Record<string, unknown>, key: string) {
  const aliases: Record<string, string[]> = {
    totalDistance: ["totalDistance", "Total Distance", "Dist"],
    dMin: ["dMin", "D/Min", "Distance Per Min"],
    maxSpeed: ["maxSpeed", "Max Spd", "Max Speed"],
    hsr: ["hsr", "HSR", "High Speed Running"],
    distZ6: ["distZ6", "Dist Z6", "Z6 Distance"],
    accDec: ["acc", "dec", "Accelerations", "Decelerations"],
  };

  if (key === "accDec") {
    const acc = aliases.accDec.find((k) => k.toLowerCase().includes("acc"));
    const dec = aliases.accDec.find((k) => k.toLowerCase().includes("dec"));
    const accValue = acc ? row[acc] : undefined;
    const decValue = dec ? row[dec] : undefined;
    if (accValue !== undefined || decValue !== undefined) {
      return `${accValue ?? 0}/${decValue ?? 0}`;
    }
    return "-";
  }

  const possibleKeys = aliases[key] || [];
  for (const possibleKey of possibleKeys) {
    if (row[possibleKey] !== undefined) {
      return String(row[possibleKey]);
    }
  }
  return "-";
}

export default function IngestaPage() {
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [existingData, setExistingData] = useState<MetricRow[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [selectedContext, setSelectedContext] = useState<"Entrenamiento" | "Partido">("Entrenamiento");
  const [selectedSegment, setSelectedSegment] = useState("Entire Session");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const segmentOptions = selectedContext === "Entrenamiento" ? trainingSegments : matchSegments;

  // Load existing data on mount
  useEffect(() => {
    fetch("/api/sessions")
      .then((r) => r.json())
      .then((sessions) => {
        if (sessions.length > 0) {
          return fetch(`/api/metrics?sessionId=${sessions[0].id}&segmentId=null`);
        }
        return null;
      })
      .then((r) => r?.json())
      .then((data) => {
        if (data?.metrics) setExistingData(data.metrics);
      });
  }, []);

  const handleUpload = useCallback(async (file: File) => {
    setUploading(true);
    setError(null);
    setUploadResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("date", new Date().toISOString());
    formData.append(
      "segment",
      selectedSegment === "Sesion Completa" || selectedSegment === "Partido Completo"
        ? "Sesión Completa"
        : selectedSegment
    );

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al procesar archivo");
      } else {
        setUploadResult(data);
        // Reload existing data
        const sessRes = await fetch("/api/sessions");
        const sessions = await sessRes.json();
        if (sessions.length > 0) {
          const metRes = await fetch(`/api/metrics?sessionId=${sessions[0].id}&segmentId=null`);
          const metData = await metRes.json();
          if (metData?.metrics) setExistingData(metData.metrics);
        }
      }
    } catch {
      setError("Error de conexión al subir archivo");
    } finally {
      setUploading(false);
    }
  }, [selectedSegment]);

  const previewRows = uploadResult?.preview?.slice(0, 5) ?? [];

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }, [handleUpload]);

  const onFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  }, [handleUpload]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-y-auto bg-white pb-20 md:pb-0">
        <header className="border-b border-slate-200 px-6 py-6 md:px-10">
          <div className="mx-auto max-w-6xl">
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Ingesta de Datos STATSports</h1>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Pipeline automatico de procesamiento CSV para metricas GPS del plantel profesional
            </p>
          </div>
        </header>

        <div className="p-6 md:p-10">
          <div className="mx-auto max-w-6xl space-y-8">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 md:p-5">
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Tipo de Dataset</label>
              <div className="relative mb-4 max-w-md">
                <select
                  value={selectedContext}
                  onChange={(e) => {
                    const value = e.target.value as "Entrenamiento" | "Partido";
                    setSelectedContext(value);
                    setSelectedSegment(value === "Entrenamiento" ? "Sesion Completa" : "Partido Completo");
                  }}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#0085CB] focus:ring-2 focus:ring-[#0085CB]/20"
                >
                  <option value="Entrenamiento">Entrenamiento</option>
                  <option value="Partido">Partido</option>
                </select>
                <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">expand_more</span>
              </div>

              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Seleccionar Segmento</label>
              <div className="relative max-w-md">
                <select
                  value={selectedSegment}
                  onChange={(e) => setSelectedSegment(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#0085CB] focus:ring-2 focus:ring-[#0085CB]/20"
                >
                  {segmentOptions.map((segment) => (
                    <option key={segment} value={segment}>
                      {segment}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">expand_more</span>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {selectedContext === "Entrenamiento"
                  ? "Opciones: Sesion Completa / Rondo / Reducido"
                  : "Opciones: Partido Completo / Primer Tiempo / Segundo Tiempo"}
              </p>
            </div>

            <div
              className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-16 text-center transition-all ${
                dragOver ? "scale-[1.01] border-[#0085CB] bg-[#0085CB]/5" : "border-[#0085CB] bg-white"
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
            >
              <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-[#0085CB]/10">
                <span className="material-symbols-outlined text-4xl text-[#0085CB]">
                  {uploading ? "sync" : "upload_file"}
                </span>
              </div>
              <div className="max-w-md space-y-2">
                <h3 className="text-xl font-bold text-slate-900">
                  {uploading ? "Procesando archivo STATSports..." : "Arrastra y suelta el CSV STATSports"}
                </h3>
                <p className="text-sm text-slate-500">
                  {uploading
                    ? "Parseando columnas tecnicas y generando registros de sesion..."
                    : "Suelta el archivo aqui o haz clic para buscar el CSV/Excel local."}
                </p>
              </div>
              {!uploading && (
                <>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-6 flex items-center gap-2 rounded-lg bg-[#0085CB] px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#0085CB]/20 transition-all hover:opacity-90"
                  >
                    <span className="material-symbols-outlined text-lg">add</span>
                    Seleccionar Archivo
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={onFileSelect}
                    className="hidden"
                  />
                </>
              )}
              {uploading && (
                <div className="mt-6 size-8 animate-spin rounded-full border-3 border-[#0085CB] border-t-transparent" />
              )}
              <p className="mt-4 text-xs font-medium uppercase tracking-widest text-slate-400">
                Formatos soportados: .csv, .xlsx, .xls
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                <span className="material-symbols-outlined text-red-500">error</span>
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}

            {uploadResult && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="material-symbols-outlined text-emerald-600 text-2xl">check_circle</span>
                  <h3 className="text-lg font-bold text-emerald-800">Ingesta Completada</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-emerald-600 font-medium">Jugadores importados</p>
                    <p className="text-2xl font-black text-emerald-800">{uploadResult.imported}</p>
                  </div>
                  <div>
                    <p className="text-emerald-600 font-medium">Columnas detectadas</p>
                    <p className="text-2xl font-black text-emerald-800">{uploadResult.columns.length}</p>
                  </div>
                  <div>
                    <p className="text-emerald-600 font-medium">ID de Sesion</p>
                    <p className="text-2xl font-black text-emerald-800">#{uploadResult.sessionId}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="border-b border-slate-100 p-5">
                <h2 className="text-lg font-bold text-slate-900">Data Mapping Preview</h2>
                <p className="text-xs text-slate-500">Vista previa de metricas parseadas desde el archivo STATSports</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-100 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-600">
                    <tr>
                      <th className="px-5 py-3">Distancia Total</th>
                      <th className="px-5 py-3">D/Min</th>
                      <th className="px-5 py-3">Vel. Max</th>
                      <th className="px-5 py-3">HSR</th>
                      <th className="px-5 py-3">Dist Z6</th>
                      <th className="px-5 py-3">Acc/Dec</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {previewRows.length > 0 ? (
                      previewRows.map((row, index) => (
                        <tr key={`preview-${index}`}>
                          <td className="px-5 py-3">{getMappedValue(row, "totalDistance")}</td>
                          <td className="px-5 py-3">{getMappedValue(row, "dMin")}</td>
                          <td className="px-5 py-3">{getMappedValue(row, "maxSpeed")}</td>
                          <td className="px-5 py-3">{getMappedValue(row, "hsr")}</td>
                          <td className="px-5 py-3">{getMappedValue(row, "distZ6")}</td>
                          <td className="px-5 py-3">{getMappedValue(row, "accDec")}</td>
                        </tr>
                      ))
                    ) : (
                      existingData.slice(0, 5).map((row) => (
                        <tr key={`existing-${row.id}`}>
                          <td className="px-5 py-3">{row.totalDistance}</td>
                          <td className="px-5 py-3">{row.dMin}</td>
                          <td className="px-5 py-3">{row.maxSpeed.toFixed(2)}</td>
                          <td className="px-5 py-3">{row.hsr}</td>
                          <td className="px-5 py-3">{row.distZ6}</td>
                          <td className="px-5 py-3">{row.acc}/{row.dec}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {existingData.length > 0 && (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 p-6">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Datos Persistidos de Sesion</h2>
                    <p className="text-xs text-slate-500">{existingData.length} filas almacenadas actualmente</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-slate-100 bg-slate-50 text-slate-600 font-semibold">
                      <tr>
                        <th className="px-5 py-3">Jugador</th>
                        <th className="px-5 py-3">Distancia Total</th>
                        <th className="px-5 py-3">D/Min</th>
                        <th className="px-5 py-3">Vel. Max</th>
                        <th className="px-5 py-3">HSR</th>
                        <th className="px-5 py-3">Dist Z6</th>
                        <th className="px-5 py-3">Acc/Dec</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {existingData.map((row) => (
                        <tr key={row.id} className="transition-colors hover:bg-slate-50/50">
                          <td className="px-5 py-3 font-medium text-slate-900">{row.player.name}</td>
                          <td className="px-5 py-3">{row.totalDistance}</td>
                          <td className="px-5 py-3">{row.dMin}</td>
                          <td className="px-5 py-3">{row.maxSpeed.toFixed(2)}</td>
                          <td className="px-5 py-3">{row.hsr}</td>
                          <td className="px-5 py-3">{row.distZ6}</td>
                          <td className="px-5 py-3">{row.acc}/{row.dec}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

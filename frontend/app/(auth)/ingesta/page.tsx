"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import RoleGuard from "@/components/RoleGuard";

interface UploadResult {
  mode: "daily" | "weekly";
  success: boolean;
  imported: number;
  playersCreated: number;
  weeksAggregated?: number;
  date?: string;
  year?: number;
  weekNumber?: number;
  columns: string[];
  preview: Record<string, unknown>[];
}

interface LastUploadInfo {
  fileName: string;
  date: string;
  mode: "daily" | "weekly";
  imported: number;
  uploadedAt: string;
}

type ModalMode = null | "daily" | "weekly";

const LAST_UPLOAD_KEY = "huachipato_last_upload";

// Generate week options 1-53
const weekOptions = Array.from({ length: 53 }, (_, i) => i + 1);

// Generate year options (current year ± 2)
const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

function getMappedValue(row: Record<string, unknown>, key: string): string {
  const aliases: Record<string, string[]> = {
    name: ["name"],
    totalDistance: ["totalDistance"],
    hsr: ["hsr"],
    sprintDistance: ["sprintDistance"],
    sprints: ["sprints"],
    accelerations: ["accelerations"],
    decelerations: ["decelerations"],
    maxSpeed: ["maxSpeed"],
    highVelocity: ["highVelocity"],
    mechanicalImpacts: ["mechanicalImpacts"],
  };
  const keys = aliases[key] || [];
  for (const k of keys) {
    if (row[k] !== undefined) return String(row[k]);
  }
  return "—";
}

export default function IngestaPage() {
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [lastUpload, setLastUpload] = useState<LastUploadInfo | null>(null);

  // Load last upload info from API (DB) on mount, fallback to localStorage
  useEffect(() => {
    async function fetchLatest() {
      try {
        const stored = localStorage.getItem(LAST_UPLOAD_KEY);
        const local: LastUploadInfo | null = stored ? JSON.parse(stored) : null;

        const res = await fetch("/api/upload/latest");
        const json = await res.json();
        if (json.latest) {
          // If localStorage has a more recent upload (with filename), prefer it
          if (local && new Date(local.uploadedAt) >= new Date(json.latest.uploadedAt)) {
            setLastUpload(local);
          } else {
            // Use DB data (no filename available)
            setLastUpload({
              fileName: "",
              date: json.latest.date.split("T")[0],
              mode: "daily",
              imported: json.latest.playersCount,
              uploadedAt: json.latest.uploadedAt,
            });
          }
        } else if (local) {
          setLastUpload(local);
        }
      } catch {
        try {
          const stored = localStorage.getItem(LAST_UPLOAD_KEY);
          if (stored) setLastUpload(JSON.parse(stored));
        } catch { /* ignore */ }
      }
    }
    fetchLatest();
  }, []);

  // Daily mode state
  const [reportDate, setReportDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  // Weekly mode state
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedWeek, setSelectedWeek] = useState(1);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(
    async (file: File) => {
      setUploading(true);
      setError(null);
      setUploadResult(null);

      const formData = new FormData();
      formData.append("file", file);

      if (modalMode === "weekly") {
        formData.append("mode", "weekly");
        formData.append("year", String(selectedYear));
        formData.append("weekNumber", String(selectedWeek));
      } else {
        formData.append("mode", "daily");
        formData.append("date", reportDate);
      }

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Error al procesar archivo");
        } else {
          setUploadResult(data);
          // Save last upload info
          const info: LastUploadInfo = {
            fileName: file.name,
            date: data.mode === "daily" ? reportDate : `S${data.weekNumber} · ${data.year}`,
            mode: data.mode === "daily" ? "daily" : "weekly",
            imported: data.imported,
            uploadedAt: new Date().toISOString(),
          };
          setLastUpload(info);
          try { localStorage.setItem(LAST_UPLOAD_KEY, JSON.stringify(info)); } catch { /* ignore */ }
          setModalMode(null); // Close modal on success
        }
      } catch {
        setError("Error de conexión al subir archivo");
      } finally {
        setUploading(false);
      }
    },
    [modalMode, reportDate, selectedYear, selectedWeek],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleUpload(file);
    },
    [handleUpload],
  );

  const onFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleUpload(file);
      // Reset input so same file can be re-selected
      e.target.value = "";
    },
    [handleUpload],
  );

  const openModal = (mode: "daily" | "weekly") => {
    setModalMode(mode);
    setError(null);
    setUploadResult(null);
  };

  const previewRows = uploadResult?.preview?.slice(0, 5) ?? [];

  return (
    <RoleGuard allowedRoles={["gps"]}>
    <div className="flex flex-col bg-white min-h-full">
        <header className="border-b border-slate-200 px-4 py-6 md:px-10">
          <div className="mx-auto max-w-6xl">
            <h1 className="text-3xl font-black tracking-tight text-slate-900">
              Ingesta de Datos GPS
            </h1>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Sube archivos CSV/Excel para alimentar el motor de cálculo ACS
            </p>
          </div>
        </header>

        <div className="p-4 md:p-10">
          <div className="mx-auto max-w-6xl space-y-8">
            {/* Two Upload Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Daily Upload Card */}
              <button
                onClick={() => openModal("daily")}
                className="group relative overflow-hidden rounded-2xl border-2 border-[#0085CB]/20 bg-gradient-to-br from-[#0085CB]/5 to-white p-8 text-left transition-all hover:border-[#0085CB]/50 hover:shadow-lg hover:shadow-[#0085CB]/10"
              >
                <div className="flex items-start gap-4">
                  <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-[#0085CB]/10">
                    <span className="material-symbols-outlined text-3xl text-[#0085CB]">
                      today
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Subir Informe Diario
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Sube el CSV del día. Selecciona la fecha exacta con un
                      calendario. La semana se calcula automáticamente.
                    </p>
                    <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#0085CB]">
                      <span className="material-symbols-outlined text-sm">
                        arrow_forward
                      </span>
                      Seleccionar fecha y archivo
                    </div>
                  </div>
                </div>
              </button>

              {/* Weekly Upload Card */}
              <button
                onClick={() => openModal("weekly")}
                className="group relative overflow-hidden rounded-2xl border-2 border-emerald-200/60 bg-gradient-to-br from-emerald-50/50 to-white p-8 text-left transition-all hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-100"
              >
                <div className="flex items-start gap-4">
                  <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
                    <span className="material-symbols-outlined text-3xl text-emerald-600">
                      date_range
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Subir Stats Semanal
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Carga histórica con S-Files. Selecciona manualmente el año
                      y número de semana para evitar desfases.
                    </p>
                    <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                      <span className="material-symbols-outlined text-sm">
                        arrow_forward
                      </span>
                      Seleccionar semana y archivo
                    </div>
                  </div>
                </div>
              </button>
            </div>

            {/* Last Upload Info */}
            {lastUpload && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex items-center gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#0085CB]/10">
                  <span className="material-symbols-outlined text-xl text-[#0085CB]">
                    history
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-0.5">
                    Última subida
                  </p>
                  <p className="text-sm font-bold text-slate-800 truncate">
                    {lastUpload.fileName || "Informe Diario"}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-slate-700">
                    {lastUpload.mode === "daily"
                      ? new Date(lastUpload.date + "T12:00:00").toLocaleDateString("es-CL", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : lastUpload.date}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {new Date(lastUpload.uploadedAt).toLocaleString("es-CL", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {" · "}{lastUpload.imported} registros
                  </p>
                </div>
              </div>
            )}

            {/* Success Result */}
            {uploadResult && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 animate-in fade-in">
                <div className="flex items-center gap-3 mb-3">
                  <span className="material-symbols-outlined text-emerald-600 text-2xl">
                    check_circle
                  </span>
                  <h3 className="text-lg font-bold text-emerald-800">
                    Ingesta Completada —{" "}
                    {uploadResult.mode === "daily"
                      ? "Informe Diario"
                      : "Stats Semanal"}
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-emerald-600 font-medium">
                      Registros importados
                    </p>
                    <p className="text-2xl font-black text-emerald-800">
                      {uploadResult.imported}
                    </p>
                  </div>
                  <div>
                    <p className="text-emerald-600 font-medium">
                      Jugadores nuevos
                    </p>
                    <p className="text-2xl font-black text-emerald-800">
                      {uploadResult.playersCreated}
                    </p>
                  </div>
                  {uploadResult.mode === "daily" && (
                    <div>
                      <p className="text-emerald-600 font-medium">
                        Semanas recalculadas
                      </p>
                      <p className="text-2xl font-black text-emerald-800">
                        {uploadResult.weeksAggregated}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-emerald-600 font-medium">Periodo</p>
                    <p className="text-2xl font-black text-emerald-800">
                      {uploadResult.mode === "daily"
                        ? new Date(uploadResult.date!).toLocaleDateString(
                            "es-CL",
                          )
                        : `S${uploadResult.weekNumber} · ${uploadResult.year}`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Preview Table */}
            {previewRows.length > 0 && (
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="border-b border-slate-100 p-5">
                  <h2 className="text-lg font-bold text-slate-900">
                    Vista Previa del Archivo
                  </h2>
                  <p className="text-xs text-slate-500">
                    Primeras 5 filas del archivo procesado
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-slate-100 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-600">
                      <tr>
                        <th className="px-5 py-3">Jugador</th>
                        <th className="px-5 py-3">Dist Total</th>
                        <th className="px-5 py-3">HSR</th>
                        <th className="px-5 py-3">Sprint Dist</th>
                        <th className="px-5 py-3">Sprints</th>
                        <th className="px-5 py-3">Acc</th>
                        <th className="px-5 py-3">Dec</th>
                        <th className="px-5 py-3">Vel Max</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {previewRows.map((row, index) => (
                        <tr key={index}>
                          <td className="px-5 py-3 font-medium text-slate-900">
                            {getMappedValue(row, "name")}
                          </td>
                          <td className="px-5 py-3">
                            {getMappedValue(row, "totalDistance")}
                          </td>
                          <td className="px-5 py-3">
                            {getMappedValue(row, "hsr")}
                          </td>
                          <td className="px-5 py-3">
                            {getMappedValue(row, "sprintDistance")}
                          </td>
                          <td className="px-5 py-3">
                            {getMappedValue(row, "sprints")}
                          </td>
                          <td className="px-5 py-3">
                            {getMappedValue(row, "accelerations")}
                          </td>
                          <td className="px-5 py-3">
                            {getMappedValue(row, "decelerations")}
                          </td>
                          <td className="px-5 py-3">
                            {getMappedValue(row, "maxSpeed")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Expected Columns Guide */}
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-5">
              <h3 className="text-sm font-bold text-slate-700 mb-3">
                Columnas esperadas del CSV
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-2">
                    Informe Diario
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Player Name",
                      "Total Distance",
                      "HSR",
                      "Sprint Distance",
                      "Sprints",
                      "Acc",
                      "Dec",
                      "Max Speed",
                    ].map((col) => (
                      <span
                        key={col}
                        className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600"
                      >
                        {col}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-2">
                    Stats Semanal (alternativa)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Player Name",
                      "Total Distance",
                      "High Velocity",
                      "Mechanical Impacts",
                    ].map((col) => (
                      <span
                        key={col}
                        className="rounded-lg bg-white border border-emerald-200 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                      >
                        {col}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-500">
                El sistema detecta automáticamente variantes de nombres de
                columna (español/inglés). Jugadores no existentes se crean
                automáticamente.
              </p>
            </div>
          </div>
        </div>

        {/* ─── MODAL ────────────────────────────────────────────── */}
        {modalMode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="mx-4 w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex size-10 items-center justify-center rounded-xl ${
                      modalMode === "daily"
                        ? "bg-[#0085CB]/10"
                        : "bg-emerald-100"
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-xl ${
                        modalMode === "daily"
                          ? "text-[#0085CB]"
                          : "text-emerald-600"
                      }`}
                    >
                      {modalMode === "daily" ? "today" : "date_range"}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {modalMode === "daily"
                        ? "Subir Informe Diario"
                        : "Subir Stats Semanal"}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {modalMode === "daily"
                        ? "Selecciona la fecha y sube el CSV del día"
                        : "Selecciona año y semana para carga histórica"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setModalMode(null);
                    setError(null);
                  }}
                  className="rounded-lg p-1 hover:bg-slate-100 transition-colors"
                >
                  <span className="material-symbols-outlined text-slate-500">
                    close
                  </span>
                </button>
              </div>

              {/* Modal Controls */}
              <div className="mb-5 space-y-4">
                {modalMode === "daily" ? (
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                      Fecha del Informe
                    </label>
                    <input
                      type="date"
                      value={reportDate}
                      onChange={(e) => setReportDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-[#0085CB] focus:ring-2 focus:ring-[#0085CB]/20"
                    />
                    <p className="mt-1.5 text-xs text-slate-400">
                      La semana del año se calcula automáticamente a partir de
                      esta fecha.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                        Año
                      </label>
                      <div className="relative">
                        <select
                          value={selectedYear}
                          onChange={(e) =>
                            setSelectedYear(parseInt(e.target.value, 10))
                          }
                          className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                        >
                          {yearOptions.map((y) => (
                            <option key={y} value={y}>
                              {y}
                            </option>
                          ))}
                        </select>
                        <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                          expand_more
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                        Semana
                      </label>
                      <div className="relative">
                        <select
                          value={selectedWeek}
                          onChange={(e) =>
                            setSelectedWeek(parseInt(e.target.value, 10))
                          }
                          className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                        >
                          {weekOptions.map((w) => (
                            <option key={w} value={w}>
                              Semana {w}
                            </option>
                          ))}
                        </select>
                        <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                          expand_more
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Dropzone */}
              <div
                className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-all ${
                  dragOver
                    ? "scale-[1.01] border-[#0085CB] bg-[#0085CB]/5"
                    : modalMode === "daily"
                      ? "border-[#0085CB]/40 bg-slate-50"
                      : "border-emerald-300 bg-emerald-50/30"
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
              >
                <div
                  className={`mb-3 flex size-12 items-center justify-center rounded-full ${
                    modalMode === "daily"
                      ? "bg-[#0085CB]/10"
                      : "bg-emerald-100"
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-2xl ${
                      uploading
                        ? "animate-spin"
                        : modalMode === "daily"
                          ? "text-[#0085CB]"
                          : "text-emerald-600"
                    }`}
                  >
                    {uploading ? "sync" : "upload_file"}
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-700">
                  {uploading
                    ? "Procesando archivo..."
                    : "Arrastra el archivo aquí"}
                </p>
                <p className="text-xs text-slate-500 mt-1">o</p>
                {!uploading && (
                  <>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className={`mt-3 flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-bold text-white transition-all hover:opacity-90 ${
                        modalMode === "daily"
                          ? "bg-[#0085CB]"
                          : "bg-emerald-600"
                      }`}
                    >
                      <span className="material-symbols-outlined text-base">
                        folder_open
                      </span>
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
                  <div className="mt-3 size-6 animate-spin rounded-full border-2 border-[#0085CB] border-t-transparent" />
                )}
                <p className="mt-3 text-[10px] font-medium uppercase tracking-widest text-slate-400">
                  .csv · .xlsx · .xls
                </p>
              </div>

              {/* Error inside modal */}
              {error && (
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 p-3">
                  <span className="material-symbols-outlined text-rose-500 text-lg">
                    error
                  </span>
                  <span className="text-sm font-medium text-rose-700">
                    {error}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}

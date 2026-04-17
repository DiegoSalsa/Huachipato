"use client";

import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/Sidebar";

interface Player {
  id: string;
  name: string;
  position: string;
  createdAt: string;
  weeklyStats: {
    totalDistance: number;
    highVelocity: number;
    mechanicalImpacts: number;
    weekNumber: number;
    year: number;
  }[];
}

const positionLabels: Record<string, string> = {
  PORTERO: "Portero",
  DEFENSA: "Defensa",
  MEDIOCAMPISTA: "Mediocampista",
  DELANTERO: "Delantero",
};

const positionOptions = [
  { value: "PORTERO", label: "Portero" },
  { value: "DEFENSA", label: "Defensa" },
  { value: "MEDIOCAMPISTA", label: "Mediocampista" },
  { value: "DELANTERO", label: "Delantero" },
];

export default function JugadoresPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPosition, setNewPosition] = useState("MEDIOCAMPISTA");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPlayers = useCallback(async () => {
    const res = await fetch("/api/players");
    const data = await res.json();
    setPlayers(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadPlayers();
  }, [loadPlayers]);

  const handleCreatePlayer = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    setError(null);

    try {
      const res = await fetch("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), position: newPosition }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error al crear jugador");
        setCreating(false);
        return;
      }

      setNewName("");
      setNewPosition("MEDIOCAMPISTA");
      setShowModal(false);
      await loadPlayers();
    } catch {
      setError("Error de conexión");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-white pb-20 md:pb-0">
        <header className="h-16 border-b border-slate-200 flex items-center justify-between px-8">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Jugadores</h2>
            <p className="text-xs text-slate-500">
              Plantel — {players.length} jugadores registrados
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0085CB] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <span className="material-symbols-outlined text-base">person_add</span>
            Agregar Jugador
          </button>
        </header>

        <div className="p-8">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin size-8 border-3 border-[#0085CB] border-t-transparent rounded-full" />
            </div>
          ) : players.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <span className="material-symbols-outlined text-6xl text-slate-300">
                groups
              </span>
              <h3 className="mt-4 text-xl font-bold text-slate-400">
                Sin jugadores registrados
              </h3>
              <p className="mt-1 text-sm text-slate-400">
                Agrega jugadores manualmente o sube un CSV.
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#0085CB] px-6 py-2.5 text-sm font-bold text-white"
              >
                <span className="material-symbols-outlined text-lg">person_add</span>
                Agregar Jugador
              </button>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Posición
                    </th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">
                      Última Dist. Semanal
                    </th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">
                      Alta Vel.
                    </th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">
                      Imp. Mecánicos
                    </th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Semana
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {players.map((player) => {
                    const stat = player.weeklyStats[0];
                    return (
                      <tr
                        key={player.id}
                        className="hover:bg-[#0085CB]/5 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                          {player.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold">
                            {positionLabels[player.position] ?? player.position}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 text-right font-medium">
                          {stat ? `${(stat.totalDistance / 1000).toFixed(1)} km` : "—"}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 text-right">
                          {stat ? `${stat.highVelocity.toLocaleString()} m` : "—"}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 text-right">
                          {stat ? stat.mechanicalImpacts : "—"}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {stat ? `S${stat.weekNumber} · ${stat.year}` : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create Player Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-slate-900">
                  Agregar Jugador
                </h3>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setError(null);
                  }}
                  className="rounded-lg p-1 hover:bg-slate-100 transition-colors"
                >
                  <span className="material-symbols-outlined text-slate-500">close</span>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.13em] text-slate-500">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Ej: Carlos Muñoz"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-[#0085CB] focus:ring-2 focus:ring-[#0085CB]/20"
                    onKeyDown={(e) => e.key === "Enter" && handleCreatePlayer()}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.13em] text-slate-500">
                    Posición
                  </label>
                  <div className="relative">
                    <select
                      value={newPosition}
                      onChange={(e) => setNewPosition(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-[#0085CB] focus:ring-2 focus:ring-[#0085CB]/20"
                    >
                      {positionOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      expand_more
                    </span>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 p-3">
                    <span className="material-symbols-outlined text-rose-500 text-lg">error</span>
                    <span className="text-sm font-medium text-rose-700">{error}</span>
                  </div>
                )}

                <button
                  onClick={handleCreatePlayer}
                  disabled={creating || !newName.trim()}
                  className="w-full rounded-xl bg-[#0085CB] py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {creating ? "Creando..." : "Crear Jugador"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

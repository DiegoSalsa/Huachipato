"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import HuachipatoLoader from "@/components/HuachipatoLoader";

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
    <div className="bg-white min-h-full">
        <header className="border-b border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between px-4 md:px-8 py-4 md:py-0 md:h-16 gap-4 md:gap-0">
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

        <div className="p-4 md:p-8 overflow-hidden">
          {loading ? (
            <HuachipatoLoader />
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
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto w-full">
                <table className="w-full text-left whitespace-nowrap">
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
                          <Link
                            href={`/jugadores/${player.id}`}
                            className="hover:text-[#0085CB] transition-colors underline decoration-transparent hover:decoration-[#0085CB] underline-offset-4"
                          >
                            {player.name}
                          </Link>
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

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-slate-100">
                {players.map((player) => {
                  const stat = player.weeklyStats[0];
                  return (
                    <Link
                      key={player.id}
                      href={`/jugadores/${player.id}`}
                      className="block p-4 hover:bg-slate-50 transition-colors active:bg-slate-100"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">{player.name}</p>
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 mt-0.5">
                            {positionLabels[player.position] ?? player.position}
                          </span>
                        </div>
                        {stat && (
                          <span className="text-[10px] font-medium text-slate-400">
                            S{stat.weekNumber} · {stat.year}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-3 mt-3">
                        <div className="text-center rounded-lg bg-slate-50 p-2">
                          <p className="text-[10px] font-bold uppercase text-slate-400">Dist.</p>
                          <p className="text-sm font-black text-slate-800">
                            {stat ? `${(stat.totalDistance / 1000).toFixed(1)}km` : "—"}
                          </p>
                        </div>
                        <div className="text-center rounded-lg bg-slate-50 p-2">
                          <p className="text-[10px] font-bold uppercase text-slate-400">Alta Vel.</p>
                          <p className="text-sm font-black text-slate-800">
                            {stat ? `${stat.highVelocity.toLocaleString()}m` : "—"}
                          </p>
                        </div>
                        <div className="text-center rounded-lg bg-slate-50 p-2">
                          <p className="text-[10px] font-bold uppercase text-slate-400">Impactos</p>
                          <p className="text-sm font-black text-slate-800">
                            {stat ? stat.mechanicalImpacts : "—"}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
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
      </div>
  );
}

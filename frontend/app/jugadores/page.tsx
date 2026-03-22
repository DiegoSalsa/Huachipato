"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";

interface Player {
  id: number;
  name: string;
  position: string;
  category: string;
  metrics: { totalDistance: number; maxSpeed: number; acc: number; dec: number }[];
}

export default function JugadoresPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/players")
      .then((r) => r.json())
      .then((data) => {
        setPlayers(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-white pb-20 md:pb-0">
        <header className="h-16 border-b border-slate-200 flex items-center px-8">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Jugadores</h2>
            <p className="text-xs text-slate-500">Plantel Profesional — {players.length} jugadores registrados</p>
          </div>
        </header>

        <div className="p-8">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin size-8 border-3 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Posición</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Dist (m)</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Max Spd</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Acc/Dec</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {players.map((player) => {
                    const m = player.metrics[0];
                    return (
                      <tr key={player.id} className="hover:bg-primary/5 transition-colors">
                        <td className="px-6 py-4 text-sm font-semibold text-slate-900">{player.name}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{player.position}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{m?.totalDistance?.toLocaleString() || "—"}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{m?.maxSpeed?.toFixed(1) || "—"}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{m ? `${m.acc}/${m.dec}` : "—"}</td>
                        <td className="px-6 py-4">
                          <Link href={`/jugadores/${player.id}`} className="text-primary text-sm font-semibold hover:underline">
                            Ver Perfil →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

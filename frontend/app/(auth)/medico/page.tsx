"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Users, Activity, CheckCircle, Clock, 
  Search, Filter, MoreHorizontal, FileText, HeartPulse 
} from "lucide-react";
import ClinicalFileSlideOver, { PlayerWithInjuries } from "@/components/ClinicalFileSlideOver";
import HuachipatoLoader from "@/components/HuachipatoLoader";

export default function MedicoPage() {
  const [players, setPlayers] = useState<PlayerWithInjuries[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Clinical File State
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerWithInjuries | null>(null);
  const [isClinicalFileOpen, setIsClinicalFileOpen] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/medico/fichas");
      if (res.ok) {
        const data = await res.json();
        setPlayers(data);
        
        // Si hay un jugador seleccionado, actualizamos su data para que la Ficha se refresque
        if (selectedPlayer) {
          const updatedPlayer = data.find((p: PlayerWithInjuries) => p.id === selectedPlayer.id);
          if (updatedPlayer) {
            setSelectedPlayer(updatedPlayer);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPlayerStatus = (player: PlayerWithInjuries) => {
    const active = player.injuries.find(i => i.status === "En recuperación" || i.status === "Recaída");
    return active ? "Lesionado" : "Sano";
  };

  const getActiveInjury = (player: PlayerWithInjuries) => {
    return player.injuries.find(i => i.status === "En recuperación" || i.status === "Recaída") || null;
  };

  const severityColors: Record<string, string> = {
    Leve: "bg-green-100 text-green-800 border-green-200",
    Moderada: "bg-yellow-100 text-yellow-800 border-yellow-200",
    Grave: "bg-red-100 text-red-800 border-red-200",
  };

  // --- Derived Data for KPIs ---
  const kpis = useMemo(() => {
    const currentlyInjured = players.filter(p => getPlayerStatus(p) === "Lesionado").length;
    
    // Altas en los últimos 30 días (buscando en todas las lesiones de todos los jugadores)
    let totalAltas = 0;
    let totalDays = 0;
    let injuriesCount = 0;

    players.forEach(p => {
      p.injuries.forEach(i => {
        if (i.status === "Alta médica") totalAltas++;
        totalDays += (i.estimatedRecoveryDays || 0);
        injuriesCount++;
      });
    });
    
    const avgDays = injuriesCount > 0 ? Math.round(totalDays / injuriesCount) : 0;

    return { currentlyInjured, totalAltas, avgDays };
  }, [players]);

  // --- Filter Logic ---
  const filteredPlayers = useMemo(() => {
    return players.filter(player => {
      const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase());
      const playerStatus = getPlayerStatus(player);
      const matchesStatus = statusFilter === "Todos" || playerStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [players, searchQuery, statusFilter]);

  const openClinicalFile = (player: PlayerWithInjuries) => {
    setSelectedPlayer(player);
    setIsClinicalFileOpen(true);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Módulo Médico</h1>
          <p className="text-gray-500 mt-1">Gestión integral de lesiones y fichas clínicas por jugador</p>
        </div>
      </div>

      {/* KPIs Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-orange-50 rounded-xl text-orange-600">
            <Activity className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Plantel Lesionado</p>
            <p className="text-3xl font-bold text-gray-900">{kpis.currentlyInjured} <span className="text-base text-gray-400 font-medium">/ {players.length}</span></p>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-emerald-50 rounded-xl text-emerald-600">
            <CheckCircle className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Altas Médicas (Histórico)</p>
            <p className="text-3xl font-bold text-gray-900">{kpis.totalAltas}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-blue-50 rounded-xl text-blue-600">
            <Clock className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Tiempo Promedio Baja</p>
            <p className="text-3xl font-bold text-gray-900">{kpis.avgDays} <span className="text-base font-medium text-gray-500">días</span></p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* Toolbar */}
        <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar por jugador..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-48">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl appearance-none bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm font-medium text-gray-700 cursor-pointer"
              >
                <option value="Todos">Todo el Plantel</option>
                <option value="Sano">Sanos</option>
                <option value="Lesionado">Lesionados</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <HuachipatoLoader />
        ) : (
          <div className="overflow-x-auto">
            {/* Desktop Table */}
            <table className="hidden md:table min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Jugador</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Estado Actual</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Último Diagnóstico</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Gravedad</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Baja Proyectada</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Ficha</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {filteredPlayers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <Users className="w-12 h-12 mb-3 text-gray-300" />
                        <p className="text-lg font-medium text-gray-900">No se encontraron jugadores</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPlayers.map((player) => {
                    const status = getPlayerStatus(player);
                    const activeInjury = getActiveInjury(player);
                    const latestInjury = activeInjury || player.injuries[0];

                    return (
                      <tr key={player.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm ${status === 'Sano' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                              {player.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{player.name}</div>
                              <div className="text-xs font-medium text-gray-500">{player.position}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border flex items-center gap-1.5 ${status === 'Sano' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                            {status}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          {latestInjury ? (
                            <>
                              <div className={`text-sm font-semibold ${activeInjury ? 'text-gray-900' : 'text-gray-400'}`}>{latestInjury.injuryType}</div>
                              <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(latestInjury.dateOfInjury).toLocaleDateString("es-CL")}
                              </div>
                            </>
                          ) : (
                            <span className="text-sm text-gray-400 italic">Sin historial</span>
                          )}
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          {latestInjury ? (
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border ${activeInjury ? severityColors[latestInjury.severity] : 'bg-gray-50 text-gray-400 border-gray-100'}`}>
                              {latestInjury.severity}
                            </span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          {activeInjury ? (
                            <div className="text-sm font-semibold text-red-600">{activeInjury.estimatedRecoveryDays} días</div>
                          ) : latestInjury ? (
                            <div className="text-sm font-medium text-gray-400 line-through">{latestInjury.estimatedRecoveryDays} días</div>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                          <button 
                            onClick={() => openClinicalFile(player)}
                            className="inline-flex items-center gap-2 px-3 py-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 font-semibold rounded-lg transition-colors"
                          >
                            <HeartPulse className="w-4 h-4" />
                            Abrir Ficha
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>

            {/* Mobile Card View */}
            <div className="md:hidden">
              {filteredPlayers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Users className="w-12 h-12 mb-3 text-gray-300" />
                  <p className="text-lg font-medium text-gray-900">No se encontraron jugadores</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredPlayers.map((player) => {
                    const status = getPlayerStatus(player);
                    const activeInjury = getActiveInjury(player);
                    const latestInjury = activeInjury || player.injuries[0];

                    return (
                      <div key={player.id} className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${status === 'Sano' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                              {player.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 text-sm">{player.name}</p>
                              <p className="text-xs text-gray-500">{player.position}</p>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${status === 'Sano' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                            {status}
                          </span>
                        </div>

                        {latestInjury && (
                          <div className="flex items-center justify-between text-xs mb-3 bg-gray-50 rounded-lg p-2.5">
                            <div>
                              <p className={`font-semibold ${activeInjury ? 'text-gray-900' : 'text-gray-400'}`}>{latestInjury.injuryType}</p>
                              <p className="text-gray-400 mt-0.5">{new Date(latestInjury.dateOfInjury).toLocaleDateString("es-CL")}</p>
                            </div>
                            <div className="text-right">
                              {latestInjury && (
                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${activeInjury ? severityColors[latestInjury.severity] : 'bg-gray-50 text-gray-400 border-gray-100'}`}>
                                  {latestInjury.severity}
                                </span>
                              )}
                              {activeInjury && (
                                <p className="text-red-600 font-bold mt-1">{activeInjury.estimatedRecoveryDays} días</p>
                              )}
                            </div>
                          </div>
                        )}

                        <button 
                          onClick={() => openClinicalFile(player)}
                          className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 text-blue-600 bg-blue-50 hover:bg-blue-100 font-semibold rounded-lg transition-colors text-sm"
                        >
                          <HeartPulse className="w-4 h-4" />
                          Abrir Ficha Clínica
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Clinical File SlideOver */}
      <ClinicalFileSlideOver 
        isOpen={isClinicalFileOpen} 
        onClose={() => setIsClinicalFileOpen(false)} 
        player={selectedPlayer} 
        onUpdate={fetchData}
      />
    </div>
  );
}

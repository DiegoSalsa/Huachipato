"use client";

import { useState, useEffect } from "react";

type Player = {
  id: string;
  name: string;
  position: string;
};

type Injury = {
  id: string;
  playerId: string;
  injuryType: string;
  severity: string;
  dateOfInjury: string;
  estimatedRecoveryDays: number;
  status: string;
  description: string | null;
  player: Player;
};

export default function MedicoPage() {
  const [injuries, setInjuries] = useState<Injury[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [playerId, setPlayerId] = useState("");
  const [injuryType, setInjuryType] = useState("");
  const [severity, setSeverity] = useState("Leve");
  const [dateOfInjury, setDateOfInjury] = useState("");
  const [estimatedRecoveryDays, setEstimatedRecoveryDays] = useState("");
  const [status, setStatus] = useState("En recuperación");
  const [description, setDescription] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [injuriesRes, playersRes] = await Promise.all([
        fetch("/api/medico/lesiones"),
        fetch("/api/players"),
      ]);
      const injuriesData = await injuriesRes.json();
      const playersData = await playersRes.json();
      setInjuries(injuriesData);
      setPlayers(playersData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/medico/lesiones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId,
          injuryType,
          severity,
          dateOfInjury,
          estimatedRecoveryDays,
          status,
          description,
        }),
      });

      if (res.ok) {
        const newInjury = await res.json();
        setInjuries([newInjury, ...injuries]);
        setIsModalOpen(false);
        // Reset form
        setPlayerId("");
        setInjuryType("");
        setSeverity("Leve");
        setDateOfInjury("");
        setEstimatedRecoveryDays("");
        setStatus("En recuperación");
        setDescription("");
      } else {
        const error = await res.json();
        alert(error.error || "Error al guardar");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error de conexión");
    }
  };

  const severityColors: Record<string, string> = {
    Leve: "bg-green-100 text-green-800",
    Moderada: "bg-yellow-100 text-yellow-800",
    Grave: "bg-red-100 text-red-800",
  };

  const statusColors: Record<string, string> = {
    "En recuperación": "bg-blue-100 text-blue-800",
    "Alta médica": "bg-emerald-100 text-emerald-800",
    "Recaída": "bg-orange-100 text-orange-800",
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Módulo Médico</h1>
          <p className="text-gray-500 mt-1">Gestión de lesiones y recuperación de jugadores</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          + Registrar Nueva Lesión
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jugador</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lesión</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gravedad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recuperación Est.</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {injuries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No hay lesiones registradas
                  </td>
                </tr>
              ) : (
                injuries.map((injury) => (
                  <tr key={injury.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{injury.player.name}</div>
                      <div className="text-sm text-gray-500">{injury.player.position}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 font-medium">{injury.injuryType}</div>
                      {injury.description && (
                        <div className="text-xs text-gray-500 truncate max-w-xs" title={injury.description}>
                          {injury.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(injury.dateOfInjury).toLocaleDateString("es-CL")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${severityColors[injury.severity] || "bg-gray-100 text-gray-800"}`}>
                        {injury.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[injury.status] || "bg-gray-100 text-gray-800"}`}>
                        {injury.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {injury.estimatedRecoveryDays} días
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Registrar Lesión</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jugador</label>
                <select
                  required
                  value={playerId}
                  onChange={(e) => setPlayerId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="">Seleccione un jugador...</option>
                  {players.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Lesión</label>
                <input
                  type="text"
                  required
                  value={injuryType}
                  onChange={(e) => setInjuryType(e.target.value)}
                  placeholder="Ej: Muscular, Esguince de tobillo"
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gravedad</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="Leve">Leve</option>
                    <option value="Moderada">Moderada</option>
                    <option value="Grave">Grave</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="En recuperación">En recuperación</option>
                    <option value="Alta médica">Alta médica</option>
                    <option value="Recaída">Recaída</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                  <input
                    type="date"
                    required
                    value={dateOfInjury}
                    onChange={(e) => setDateOfInjury(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Días est. de baja</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={estimatedRecoveryDays}
                    onChange={(e) => setEstimatedRecoveryDays(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (Opcional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                ></textarea>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  Guardar Lesión
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { X, Calendar, Activity, Clock, FileText, User, Edit2, Check, AlertCircle, Plus, HeartPulse } from "lucide-react";

export type ClinicalFileInjury = {
  id: string;
  injuryType: string;
  severity: string;
  dateOfInjury: string;
  estimatedRecoveryDays: number;
  status: string;
  description: string | null;
};

export type PlayerWithInjuries = {
  id: string;
  name: string;
  position: string;
  injuries: ClinicalFileInjury[];
};

interface ClinicalFileSlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerWithInjuries | null;
  onUpdate: () => void;
  readOnly?: boolean;
}

export default function ClinicalFileSlideOver({ isOpen, onClose, player, onUpdate, readOnly = false }: ClinicalFileSlideOverProps) {
  // Estado de lesion activa
  const activeInjury = player?.injuries.find(i => i.status === "En recuperación" || i.status === "Recaída") || null;
  
  // Estado de edicion
  const [isEditing, setIsEditing] = useState(false);
  const [editDays, setEditDays] = useState<number>(0);
  const [editStatus, setEditStatus] = useState("");
  const [editSeverity, setEditSeverity] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Estado de registro de nueva lesion
  const [isRegistering, setIsRegistering] = useState(false);
  const [newInjuryType, setNewInjuryType] = useState("");
  const [newSeverity, setNewSeverity] = useState("Leve");
  const [newDate, setNewDate] = useState("");
  const [newDays, setNewDays] = useState("");
  const [newStatus, setNewStatus] = useState("En recuperación");
  const [newDescription, setNewDescription] = useState("");

  // Estado ACS
  const [acwrRatio, setAcwrRatio] = useState<number | null>(null);
  const [acwrStatus, setAcwrStatus] = useState<string>("Cargando...");
  const [acwrColor, setAcwrColor] = useState<string>("text-gray-600");
  const [acwrBgColor, setAcwrBgColor] = useState<string>("bg-gray-100");

  useEffect(() => {
    if (player && isOpen) {
      if (activeInjury) {
        setEditDays(activeInjury.estimatedRecoveryDays);
        setEditStatus(activeInjury.status);
        setEditSeverity(activeInjury.severity);
      }
      setIsEditing(false);
      setIsRegistering(false);
      fetchAcwrData(player.id);
    }
  }, [player, activeInjury, isOpen]);

  const fetchAcwrData = async (playerId: string) => {
    setAcwrStatus("Cargando...");
    setAcwrColor("text-gray-600");
    setAcwrBgColor("bg-gray-100");
    setAcwrRatio(null);
    try {
      const res = await fetch("/api/acwr");
      if (res.ok) {
        const data = await res.json();
        const playerAcwr = data.players?.find((p: any) => p.playerId === playerId);
        if (playerAcwr) {
          const ratio = playerAcwr.ratioDistance28;
          setAcwrRatio(ratio);
          
          const risk = playerAcwr.overallRisk;
          
          if (ratio === null) {
            setAcwrStatus("Sin datos suficientes");
          } else if (risk === "bajo") {
            setAcwrStatus("Subentrenamiento (Peligro)");
            setAcwrColor("text-blue-600");
            setAcwrBgColor("bg-blue-100");
          } else if (risk === "optimo") {
            setAcwrStatus("Punto Óptimo (Sweet Spot)");
            setAcwrColor("text-green-600");
            setAcwrBgColor("bg-green-100");
          } else if (risk === "cuidado") {
            setAcwrStatus("Zona de Precaución");
            setAcwrColor("text-yellow-600");
            setAcwrBgColor("bg-yellow-100");
          } else if (risk === "alto") {
            setAcwrStatus("Zona de Peligro (Sobrecarga)");
            setAcwrColor("text-red-600");
            setAcwrBgColor("bg-red-100");
          } else {
            setAcwrStatus("Estado desconocido");
          }
        } else {
          setAcwrStatus("Sin datos");
        }
      } else {
        setAcwrStatus("Error en respuesta");
      }
    } catch (error) {
      setAcwrStatus("Error de conexión");
    }
  };

  const handleUpdateInjury = async () => {
    if (!activeInjury) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/medico/lesiones/${activeInjury.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estimatedRecoveryDays: editDays,
          status: editStatus,
          severity: editSeverity,
        }),
      });

      if (res.ok) {
        setIsEditing(false);
        onUpdate();
      } else {
        alert("Error al actualizar la lesión");
      }
    } catch (error) {
      alert("Error de conexión");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDischarge = async () => {
    if (!activeInjury) return;
    const confirm = window.confirm("¿Estás seguro de dar el Alta Médica a este jugador?");
    if (!confirm) return;
    
    setIsSaving(true);
    try {
      const res = await fetch(`/api/medico/lesiones/${activeInjury.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Alta médica" }),
      });

      if (res.ok) {
        onUpdate();
        // No cerramos la ficha, así puede ver el historial actualizado
      } else {
        alert("Error al dar de alta");
      }
    } catch (error) {
      alert("Error de conexión");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegisterInjury = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!player) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/medico/lesiones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: player.id,
          injuryType: newInjuryType,
          severity: newSeverity,
          dateOfInjury: newDate,
          estimatedRecoveryDays: newDays,
          status: newStatus,
          description: newDescription,
        }),
      });

      if (res.ok) {
        // Limpiar formulario
        setNewInjuryType("");
        setNewSeverity("Leve");
        setNewDate("");
        setNewDays("");
        setNewStatus("En recuperación");
        setNewDescription("");
        setIsRegistering(false);
        onUpdate(); // Actualiza la vista principal y vuelve a cargar el jugador
      } else {
        alert("Error al registrar la lesión");
      }
    } catch (error) {
      alert("Error de conexión");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !player) return null;

  return (
    <>
      {/* Fondo del panel */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Panel lateral */}
      <div className={`fixed inset-y-0 right-0 z-50 w-full md:max-w-lg bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
        
        {/* Encabezado */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-red-500" />
            Ficha Clínica
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto">
          {/* Encabezado del jugador */}
          <div className="p-6 bg-gradient-to-b from-gray-50 to-white border-b border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shadow-inner">
                <User className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{player.name}</h3>
                <p className="text-sm font-medium text-gray-500">{player.position}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${activeInjury ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {activeInjury ? 'Lesionado' : 'Sano'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-8">
            
            {/* Contexto ACS */}
            <section>
              <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-500" />
                Contexto Físico Actual
              </h4>
              <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Estado ACS</span>
                  {acwrRatio !== null ? (
                     <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${acwrBgColor} ${acwrColor}`}>
                       {acwrRatio.toFixed(2)}
                     </span>
                  ) : (
                    <span className="text-xs text-gray-400">N/A</span>
                  )}
                </div>
                <p className={`text-lg font-bold mb-1 ${acwrColor}`}>{acwrStatus}</p>
                <p className="text-xs text-gray-500 flex items-start gap-1">
                  <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                  Métrica de carga de trabajo semanal del jugador. Sirve para evaluar el riesgo en la toma de decisiones médicas.
                </p>
              </div>
            </section>

            {/* Estado actual y registro */}
            <section>
              {activeInjury ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                      <FileText className="w-4 h-4 text-red-500" />
                      Lesión Activa
                    </h4>
                    {!readOnly && (
                    <button 
                      onClick={() => isEditing ? handleUpdateInjury() : setIsEditing(true)}
                      disabled={isSaving}
                      className={`text-xs flex items-center gap-1 font-medium px-2 py-1 rounded-md transition-colors ${
                        isEditing ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      {isSaving ? "Guardando..." : isEditing ? <><Check className="w-3 h-3" /> Guardar</> : <><Edit2 className="w-3 h-3" /> Editar</>}
                    </button>
                    )}
                  </div>

                  <div className="bg-white border border-red-100 rounded-xl p-4 shadow-sm space-y-4 relative">
                    <div>
                      <p className="text-xs text-gray-500 font-medium mb-1">Diagnóstico</p>
                      <p className="text-sm font-semibold text-gray-900">{activeInjury.injuryType}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 font-medium mb-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Fecha
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(activeInjury.dateOfInjury).toLocaleDateString("es-CL")}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium mb-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Baja Proyectada
                        </p>
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <input 
                              type="number" min="0" value={editDays} 
                              onChange={(e) => setEditDays(Number(e.target.value))}
                              className="w-16 border border-gray-300 rounded px-1 py-0.5 text-sm outline-none focus:border-blue-500"
                            />
                            <span className="text-xs text-gray-500">días</span>
                          </div>
                        ) : (
                          <p className="text-sm font-medium text-gray-900">{activeInjury.estimatedRecoveryDays} días</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-50">
                      <div>
                        <p className="text-xs text-gray-500 font-medium mb-1">Gravedad</p>
                        {isEditing ? (
                          <select 
                            value={editSeverity} onChange={(e) => setEditSeverity(e.target.value)}
                            className="w-full border border-gray-300 rounded px-1 py-1 text-sm outline-none focus:border-blue-500"
                          >
                            <option value="Leve">Leve</option>
                            <option value="Moderada">Moderada</option>
                            <option value="Grave">Grave</option>
                          </select>
                        ) : (
                          <p className="text-sm font-semibold text-gray-900">{activeInjury.severity}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium mb-1">Estado</p>
                        {isEditing ? (
                          <select 
                            value={editStatus} onChange={(e) => setEditStatus(e.target.value)}
                            className="w-full border border-gray-300 rounded px-1 py-1 text-sm outline-none focus:border-blue-500"
                          >
                            <option value="En recuperación">En recuperación</option>
                            <option value="Recaída">Recaída</option>
                          </select>
                        ) : (
                          <p className="text-sm font-semibold text-gray-900">{activeInjury.status}</p>
                        )}
                      </div>
                    </div>
                    {activeInjury.description && (
                      <div>
                        <p className="text-xs text-gray-500 font-medium mb-1">Observaciones</p>
                        <p className="text-sm text-gray-700">{activeInjury.description}</p>
                      </div>
                    )}
                    
                    {/* Accion para alta medica */}
                    {!isEditing && !readOnly && (
                      <div className="pt-2 border-t border-gray-50 flex justify-end">
                        <button 
                          onClick={handleDischarge} disabled={isSaving}
                          className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <Check className="w-3 h-3" /> Dar Alta Médica
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {!readOnly ? (
                  !isRegistering ? (
                    <button 
                      onClick={() => setIsRegistering(true)}
                      className="w-full border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all group"
                    >
                      <Plus className="w-8 h-8 mb-2 text-gray-400 group-hover:text-blue-500" />
                      <span className="font-semibold">Registrar Nueva Lesión</span>
                      <span className="text-xs mt-1 text-gray-400 text-center">El jugador se encuentra sano. Registra un incidente médico aquí.</span>
                    </button>
                  ) : (
                    <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 shadow-sm">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-sm font-semibold text-blue-900">Nueva Lesión</h4>
                        <button onClick={() => setIsRegistering(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                      </div>
                      <form onSubmit={handleRegisterInjury} className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Diagnóstico</label>
                          <input required value={newInjuryType} onChange={e=>setNewInjuryType(e.target.value)} className="w-full text-sm border rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Fecha</label>
                            <input type="date" required value={newDate} onChange={e=>setNewDate(e.target.value)} className="w-full text-sm border rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500" />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Baja est. (días)</label>
                            <input type="number" min="0" required value={newDays} onChange={e=>setNewDays(e.target.value)} className="w-full text-sm border rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500" />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Gravedad</label>
                            <select value={newSeverity} onChange={e=>setNewSeverity(e.target.value)} className="w-full text-sm border rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500">
                              <option value="Leve">Leve</option><option value="Moderada">Moderada</option><option value="Grave">Grave</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Estado</label>
                            <select value={newStatus} onChange={e=>setNewStatus(e.target.value)} className="w-full text-sm border rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500">
                              <option value="En recuperación">En recuperación</option><option value="Recaída">Recaída</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Observaciones</label>
                          <textarea value={newDescription} onChange={e=>setNewDescription(e.target.value)} className="w-full text-sm border rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500 resize-none" rows={2} />
                        </div>
                        <div className="pt-2 flex justify-end">
                          <button type="submit" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors">
                            {isSaving ? "Guardando..." : "Guardar Registro"}
                          </button>
                        </div>
                      </form>
                    </div>
                  )
                  ) : (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
                      <span className="material-symbols-outlined text-4xl text-emerald-400 mb-2">check_circle</span>
                      <p className="text-sm font-semibold text-emerald-700">Jugador sano</p>
                      <p className="text-xs text-emerald-600 mt-1">Sin lesiones activas registradas</p>
                    </div>
                  )}
                </>
              )}
            </section>

            {/* Historial de evolucion */}
            <section>
              <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                Historial Médico
              </h4>
              <div className="relative pl-4 border-l-2 border-gray-100 space-y-6">
                
                {player.injuries.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">No hay registros médicos pasados.</p>
                ) : (
                  player.injuries.map((inj, index) => {
                    const isAlta = inj.status === "Alta médica";
                    const isLatest = index === 0;
                    return (
                      <div key={inj.id} className="relative">
                        <div className={`absolute -left-[21px] w-3 h-3 rounded-full ring-4 ring-white ${isAlta ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        <p className="text-xs font-medium text-gray-500 mb-1 flex justify-between">
                          <span>{new Date(inj.dateOfInjury).toLocaleDateString("es-CL")}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${isAlta ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{inj.status}</span>
                        </p>
                        <div className={`rounded-lg p-3 border ${isAlta ? 'bg-gray-50 border-gray-200' : 'bg-red-50/50 border-red-100'}`}>
                          <p className={`text-sm font-semibold ${isAlta ? 'text-gray-700' : 'text-red-900'}`}>{inj.injuryType}</p>
                          <p className="text-xs text-gray-500 mt-1">Gravedad {inj.severity} • {inj.estimatedRecoveryDays} días est.</p>
                          {isLatest && !isAlta && <span className="absolute top-3 right-3 flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span></span>}
                        </div>
                      </div>
                    )
                  })
                )}

              </div>
            </section>

          </div>
        </div>
      </div>
    </>
  );
}

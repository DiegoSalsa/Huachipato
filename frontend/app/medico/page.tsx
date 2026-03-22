import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import StatCard from "@/components/StatCard";

interface Injury {
  name: string;
  imageUrl: string;
  injury: string;
  date: string;
  progress: number;
  days: string;
  barColor: string;
}

const injuries: Injury[] = [];

export default function MedicoPage() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-white pb-20 md:pb-0">
        <Header
          title="Seguimiento Médico y de Lesiones"
          subtitle="Monitoreo de recuperación en tiempo real para el primer equipo."
        >
          <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">
            <span className="material-symbols-outlined text-sm">add</span>
            Registrar Lesión
          </button>
        </Header>

        <div className="p-8">
          {/* Top Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard
              label="Lesiones Activas"
              value="0"
              icon="warning"
              iconColor="text-slate-400"
              trend={{ text: "Sin jugadores lesionados", type: "neutral" }}
            />
            <StatCard
              label="Prom. de Recuperación"
              value="0 Días"
              icon="schedule"
              iconColor="text-slate-400"
              trend={{ text: "-", type: "neutral" }}
            />
            <StatCard
              label="Altas Médicas (Semana)"
              value="0"
              icon="check_circle"
              iconColor="text-slate-400"
              trend={{ text: "-", type: "neutral" }}
            />
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Injuries Table */}
            <div className="flex-1">
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="font-bold text-slate-900">Casos Recientes</h3>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                      search
                    </span>
                    <input
                      className="pl-10 pr-4 py-1.5 text-sm bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-primary w-48 transition-all"
                      placeholder="Buscar jugador..."
                      type="text"
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="px-6 py-3 text-xs font-bold uppercase text-slate-500 tracking-wider">
                          Nombre del Jugador
                        </th>
                        <th className="px-6 py-3 text-xs font-bold uppercase text-slate-500 tracking-wider">
                          Tipo de Lesión
                        </th>
                        <th className="px-6 py-3 text-xs font-bold uppercase text-slate-500 tracking-wider">
                          Fecha de Diagnóstico
                        </th>
                        <th className="px-6 py-3 text-xs font-bold uppercase text-slate-500 tracking-wider">
                          Retorno Est. (Días)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {injuries.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-8 text-center text-slate-500 text-sm">
                            No hay datos de jugadores lesionados.
                          </td>
                        </tr>
                      ) : (
                        injuries.map((injury) => (
                          <tr key={injury.name} className="hover:bg-primary/5 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-slate-200 overflow-hidden">
                                  <img
                                    className="h-full w-full object-cover"
                                    alt={`Perfil de ${injury.name}`}
                                    src={injury.imageUrl}
                                  />
                                </div>
                                <span className="text-sm font-semibold text-slate-900">
                                  {injury.name}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-slate-600">{injury.injury}</span>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-500">{injury.date}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex-1 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                  <div
                                    className={`${injury.barColor} h-full`}
                                    style={{ width: `${injury.progress}%` }}
                                  />
                                </div>
                                <span className="text-xs font-bold text-slate-900">{injury.days}</span>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Sidebar Anatomy Chart */}
            <div className="w-full lg:w-80">
              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h3 className="font-bold text-slate-900 mb-6 text-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">accessibility</span>
                  Mapa de Lesiones
                </h3>
                <div className="relative flex justify-center py-4">
                  {/* Human Diagram */}
                  <div className="relative w-40 h-80 opacity-60 flex justify-center items-center text-slate-300">
                    <span className="material-symbols-outlined text-[12rem]">man</span>
                    {/* Hotspots */}
                    <div className="absolute top-[50%] left-[55%] group cursor-pointer">
                      <div className="h-4 w-4 bg-red-500/80 rounded-full animate-pulse ring-4 ring-red-500/20" />
                      <div className="absolute hidden group-hover:block bottom-full left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap mb-2 shadow-xl">
                        Isquiotibial (2)
                      </div>
                    </div>
                    <div className="absolute top-[85%] left-[60%] group cursor-pointer">
                      <div className="h-3 w-3 bg-primary/80 rounded-full ring-4 ring-primary/20" />
                      <div className="absolute hidden group-hover:block bottom-full left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap mb-2 shadow-xl">
                        Tobillo (1)
                      </div>
                    </div>
                    <div className="absolute top-[65%] left-[45%] group cursor-pointer">
                      <div className="h-3 w-3 bg-amber-400/80 rounded-full ring-4 ring-amber-400/20" />
                      <div className="absolute hidden group-hover:block bottom-full left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap mb-2 shadow-xl">
                        Rodilla (1)
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-8 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      <span className="text-xs text-slate-600">Gravedad Alta</span>
                    </div>
                    <span className="text-xs font-bold">0 Casos</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="text-xs text-slate-600">Moderada</span>
                    </div>
                    <span className="text-xs font-bold">0 Casos</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary" />
                      <span className="text-xs text-slate-600">Leve / Fatiga</span>
                    </div>
                    <span className="text-xs font-bold">0 Casos</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

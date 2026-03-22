interface PlayerCardProps {
  name: string;
  position: string;
  imageUrl: string;
  status: "optimal" | "warning" | "danger";
  load: string;
  speed: string;
  distance: string;
  miniChart: number[];
}

const statusConfig = {
  optimal: {
    label: "Óptimo",
    gradient: "from-green-600/60",
    badge: "bg-green-500",
    barColors: ["bg-green-200", "bg-green-300", "bg-green-400", "bg-green-500"],
  },
  warning: {
    label: "Advertencia",
    gradient: "from-amber-600/60",
    badge: "bg-amber-500",
    barColors: ["bg-amber-200", "bg-amber-300", "bg-amber-400", "bg-amber-500"],
  },
  danger: {
    label: "Riesgo Alto",
    gradient: "from-red-600/60",
    badge: "bg-red-600",
    barColors: ["bg-red-200", "bg-red-300", "bg-red-400", "bg-red-600"],
  },
};

export default function PlayerCard({
  name,
  position,
  imageUrl,
  status,
  load,
  speed,
  distance,
  miniChart,
}: PlayerCardProps) {
  const config = statusConfig[status];

  return (
    <div className="group relative bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300">
      {/* Image */}
      <div
        className="aspect-[4/3] bg-center bg-cover relative"
        style={{ backgroundImage: `url("${imageUrl}")` }}
      >
        <div className={`absolute inset-0 bg-gradient-to-t ${config.gradient} to-transparent`} />
        <div
          className={`absolute top-4 left-4 ${config.badge} text-white text-[10px] font-black uppercase px-2 py-1 rounded ${
            status === "danger" ? "animate-pulse" : ""
          }`}
        >
          {config.label}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 leading-none">{name}</h3>
            <p className="text-xs text-slate-500 mt-1 font-semibold uppercase tracking-wider">
              {position}
            </p>
          </div>
          <div className="w-16 h-8 bg-slate-50 rounded flex items-end justify-between px-1 pb-1">
            {miniChart.map((height, i) => (
              <div
                key={i}
                className={`w-2 ${config.barColors[i % config.barColors.length]} rounded-t-sm`}
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between text-sm py-3 border-t border-slate-100">
          <div className="text-center">
            <p className="text-xs text-slate-400 font-bold uppercase">Carga</p>
            <p className={`font-bold ${status === "danger" ? "text-red-600" : "text-slate-900"}`}>
              {load}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400 font-bold uppercase">Vel.</p>
            <p className="font-bold text-slate-900">{speed}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400 font-bold uppercase">Dist.</p>
            <p className="font-bold text-slate-900">{distance}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

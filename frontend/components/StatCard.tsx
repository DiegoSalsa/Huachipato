interface StatCardProps {
  label: string;
  value: string;
  icon: string;
  iconColor: string;
  trend?: {
    text: string;
    type: "up" | "down" | "neutral";
  };
}

export default function StatCard({ label, value, icon, iconColor, trend }: StatCardProps) {
  const trendColorMap = {
    up: "text-red-500",
    down: "text-emerald-500",
    neutral: "text-slate-400",
  };

  const trendIconMap = {
    up: "trending_up",
    down: "trending_down",
    neutral: "",
  };

  return (
    <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl">
      <div className="flex items-center justify-between mb-2">
        <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">{label}</span>
        <span className={`material-symbols-outlined ${iconColor}`}>{icon}</span>
      </div>
      <p className="text-3xl font-black text-slate-900">{value}</p>
      {trend && (
        <div className={`mt-2 text-xs ${trendColorMap[trend.type]} flex items-center gap-1`}>
          {trendIconMap[trend.type] && (
            <span className="material-symbols-outlined text-xs">{trendIconMap[trend.type]}</span>
          )}
          <span>{trend.text}</span>
        </div>
      )}
    </div>
  );
}

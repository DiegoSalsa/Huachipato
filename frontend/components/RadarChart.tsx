export default function RadarChart() {
  return (
    <div className="fixed bottom-8 right-8 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 hidden xl:block">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">
          Radar GPS
        </h4>
        <span className="material-symbols-outlined text-slate-400 cursor-pointer">close</span>
      </div>
      <div className="relative aspect-square flex items-center justify-center">
        <svg className="w-full h-full overflow-visible" viewBox="0 0 200 200">
          {/* Hexagonal grid lines */}
          {[1, 0.75, 0.5, 0.25].map((scale) => {
            const r = 80 * scale;
            const pts = Array.from({ length: 6 }, (_, i) => {
              const angle = (Math.PI / 2) + (i * (2 * Math.PI) / 6);
              return `${100 + r * Math.cos(angle)},${100 - r * Math.sin(angle)}`;
            }).join(" ");
            return <polygon key={scale} points={pts} fill="none" stroke="#e2e8f0" strokeWidth="0.7" />;
          })}
          {/* Axes */}
          {Array.from({ length: 6 }, (_, i) => {
            const angle = (Math.PI / 2) + (i * (2 * Math.PI) / 6);
            return (
              <line
                key={i}
                x1="100" y1="100"
                x2={100 + 80 * Math.cos(angle)}
                y2={100 - 80 * Math.sin(angle)}
                stroke="#e2e8f0" strokeWidth="0.7"
              />
            );
          })}
          {/* Category Average (hexagon) */}
          <polygon
            points="100,30 157,65 157,135 100,170 43,135 43,65"
            fill="rgba(148, 163, 184, 0.15)"
            stroke="#94a3b8"
            strokeDasharray="3,3"
            strokeWidth="1"
          />
          {/* Player Shape */}
          <polygon
            points="100,22 162,55 150,145 100,175 50,140 42,60"
            fill="rgba(0, 133, 204, 0.25)"
            stroke="#0085cc"
            strokeWidth="2"
          />
          {/* Data Points */}
          <circle cx="100" cy="22" r="3" fill="#0085cc" />
          <circle cx="162" cy="55" r="3" fill="#0085cc" />
          <circle cx="150" cy="145" r="3" fill="#0085cc" />
          <circle cx="100" cy="175" r="3" fill="#0085cc" />
          <circle cx="50" cy="140" r="3" fill="#0085cc" />
          <circle cx="42" cy="60" r="3" fill="#0085cc" />
        </svg>

        {/* Labels around the hexagon */}
        <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[8px] font-bold text-slate-500 uppercase tracking-wider text-center whitespace-nowrap">
          Máx. Vel
        </span>
        <span className="absolute top-[18%] -right-2 text-[8px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
          HSR
        </span>
        <span className="absolute bottom-[18%] -right-2 text-[8px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
          Dist Z6
        </span>
        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[8px] font-bold text-slate-500 uppercase tracking-wider text-center whitespace-nowrap">
          D/Min
        </span>
        <span className="absolute bottom-[18%] -left-2 text-[8px] font-bold text-slate-500 uppercase tracking-wider text-right whitespace-nowrap">
          Dec
        </span>
        <span className="absolute top-[18%] -left-2 text-[8px] font-bold text-slate-500 uppercase tracking-wider text-right whitespace-nowrap">
          Acc
        </span>
      </div>
      <div className="mt-4 flex items-center justify-between text-[10px]">
        <div className="flex items-center gap-2 font-bold text-slate-600">
          <span className="size-2 bg-primary/40 border border-primary/60 rounded-full" />
          Jugador Actual
        </div>
        <div className="flex items-center gap-2 font-bold text-slate-400">
          <span className="size-2 border border-slate-300 border-dashed rounded-full" />
          Promedio Categoría
        </div>
      </div>
    </div>
  );
}

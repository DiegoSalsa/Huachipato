"use client";

import { useEffect, useState } from "react";

interface Segment {
  id: number;
  name: string;
}

interface Session {
  id: number;
  segments: Segment[];
}

const matchSegmentNames = new Set(["Primer Tiempo", "Segundo Tiempo"]);

export default function SegmentFilter({
  onChange,
}: {
  onChange: (segmentId: string | null) => void;
}) {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [defaultLabel, setDefaultLabel] = useState("Sesion Completa");

  useEffect(() => {
    fetch("/api/sessions")
      .then((r) => r.json())
      .then((data: Session[]) => {
        if (data.length > 0) {
          const latestSegments = data[0].segments || [];
          setSegments(latestSegments);
          const hasMatchSegments = latestSegments.some((segment) => matchSegmentNames.has(segment.name));
          setDefaultLabel(hasMatchSegments ? "Partido Completo" : "Sesion Completa");
        }
      });
  }, []);

  const getOptionLabel = (segment: Segment) => {
    if (segment.name === "Primer Tiempo" || segment.name === "Segundo Tiempo") {
      return `Partido · ${segment.name}`;
    }
    if (segment.name === "Rondo" || segment.name === "Reducido") {
      return `Entrenamiento · ${segment.name}`;
    }
    return segment.name;
  };

  return (
    <div className="relative">
      <select
        className="appearance-none bg-slate-50 border border-slate-200 rounded-lg py-2 pl-3 pr-8 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 cursor-pointer"
        onChange={(e) => onChange(e.target.value || null)}
        defaultValue=""
      >
        <option value="">{defaultLabel}</option>
        {segments.map((s) => (
          <option key={s.id} value={s.id}>
            {getOptionLabel(s)}
          </option>
        ))}
      </select>
      <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[18px]">
        expand_more
      </span>
    </div>
  );
}

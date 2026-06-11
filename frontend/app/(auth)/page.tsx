"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import HuachipatoLoader from "@/components/HuachipatoLoader";
import AcwrBadge from "@/components/AcwrBadge";

type AcwrRisk = "bajo" | "optimo" | "cuidado" | "alto";

interface PlayerInjuryOverview {
  id: string;
  name: string;
  position: string;
  injuries: {
    id: string;
    injuryType: string;
    severity: string;
    dateOfInjury: string;
    estimatedRecoveryDays: number;
    status: string;
  }[];
}

interface AcwrPlayer {
  playerId: string;
  playerName: string;
  position: string;
  overallRisk: AcwrRisk | null;
  currentWeek: { totalDistance: number } | null;
}

// ─── Date formatting ────────────────────────────────────────────────

function getTodayFormatted(): string {
  return new Date().toLocaleDateString("es-CL", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ─── Quick Action Card ──────────────────────────────────────────────

function QuickAction({
  href,
  icon,
  label,
  description,
  variant,
}: {
  href: string;
  icon: string;
  label: string;
  description: string;
  variant: "blue" | "emerald" | "amber" | "rose" | "violet";
}) {
  const styles: Record<string, { card: string; iconWrap: string; iconColor: string; arrow: string }> = {
    blue:    { card: "bg-[#0085CB]/5 border-[#0085CB]/20 hover:border-[#0085CB]/40 hover:shadow-lg hover:shadow-[#0085CB]/10", iconWrap: "bg-[#0085CB]/10", iconColor: "text-[#0085CB]", arrow: "text-[#0085CB]" },
    emerald: { card: "bg-emerald-50/60 border-emerald-200 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-100", iconWrap: "bg-emerald-100", iconColor: "text-emerald-600", arrow: "text-emerald-600" },
    amber:   { card: "bg-amber-50/60 border-amber-200 hover:border-amber-300 hover:shadow-lg hover:shadow-amber-100", iconWrap: "bg-amber-100", iconColor: "text-amber-600", arrow: "text-amber-600" },
    rose:    { card: "bg-rose-50/60 border-rose-200 hover:border-rose-300 hover:shadow-lg hover:shadow-rose-100", iconWrap: "bg-rose-100", iconColor: "text-rose-600", arrow: "text-rose-600" },
    violet:  { card: "bg-violet-50/60 border-violet-200 hover:border-violet-300 hover:shadow-lg hover:shadow-violet-100", iconWrap: "bg-violet-100", iconColor: "text-violet-600", arrow: "text-violet-600" },
  };
  const s = styles[variant];

  return (
    <Link
      href={href}
      className={`group rounded-2xl border-2 p-4 md:p-5 transition-all ${s.card}`}
    >
      <div className="flex items-center gap-3 md:gap-4">
        <div className={`flex size-11 md:size-12 shrink-0 items-center justify-center rounded-xl ${s.iconWrap}`}>
          <span className={`material-symbols-outlined text-2xl ${s.iconColor}`}>{icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm md:text-base font-bold text-slate-900 truncate">{label}</h3>
          <p className="text-xs text-slate-500 truncate">{description}</p>
        </div>
        <span className={`material-symbols-outlined text-lg ${s.arrow} opacity-0 group-hover:opacity-100 transition-opacity hidden md:block`}>
          arrow_forward
        </span>
      </div>
    </Link>
  );
}

// ─── KPI Stat ───────────────────────────────────────────────────────

function KpiCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
  accent: "blue" | "emerald" | "amber" | "rose";
}) {
  const styles: Record<string, { bg: string; icon: string; text: string }> = {
    blue:    { bg: "bg-[#0085CB]/5 border-[#0085CB]/20", icon: "text-[#0085CB]", text: "text-[#0085CB]" },
    emerald: { bg: "bg-emerald-50 border-emerald-200", icon: "text-emerald-600", text: "text-emerald-700" },
    amber:   { bg: "bg-amber-50 border-amber-200", icon: "text-amber-600", text: "text-amber-700" },
    rose:    { bg: "bg-rose-50 border-rose-200", icon: "text-rose-600", text: "text-rose-700" },
  };
  const s = styles[accent];

  return (
    <div className={`rounded-2xl border p-4 md:p-5 ${s.bg}`}>
      <div className="flex items-center gap-2 mb-1.5">
        <span className={`material-symbols-outlined text-lg ${s.icon}`}>{icon}</span>
        <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-slate-500">{label}</span>
      </div>
      <p className={`text-2xl md:text-3xl font-black ${s.text}`}>{value}</p>
      {sub && <p className="text-[10px] md:text-[11px] font-medium text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Injury Row (Desktop + Mobile) ──────────────────────────────────

function InjuryRow({ injury, severityColors }: {
  injury: { id: string; playerName: string; injuryType: string; severity: string; dateOfInjury: string; estimatedRecoveryDays: number };
  severityColors: Record<string, string>;
}) {
  return (
    <div className="px-4 md:px-6 py-3.5 flex items-center justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-slate-900 text-sm truncate">{injury.playerName}</p>
        <p className="text-xs text-slate-500 truncate">{injury.injuryType}</p>
        <p className="text-[10px] text-slate-400 mt-0.5 md:hidden">
          {new Date(injury.dateOfInjury).toLocaleDateString("es-CL")}
        </p>
      </div>
      <div className="hidden md:block text-xs text-slate-400 shrink-0">
        {new Date(injury.dateOfInjury).toLocaleDateString("es-CL")}
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${severityColors[injury.severity] ?? "bg-slate-100 text-slate-600"}`}>
          {injury.severity}
        </span>
        <p className="text-xs font-bold text-rose-600">{injury.estimatedRecoveryDays}d</p>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────

export default function WelcomePage() {
  const { user, hasRole } = useAuth();
  const [injuryData, setInjuryData] = useState<PlayerInjuryOverview[]>([]);
  const [acwrData, setAcwrData] = useState<AcwrPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const promises: Promise<void>[] = [];

        if (hasRole("medico", "admin")) {
          promises.push(
            fetch("/api/medico/fichas")
              .then((r) => r.json())
              .then((data) => setInjuryData(data))
              .catch(() => {})
          );
        }

        if (hasRole("gps", "admin")) {
          promises.push(
            fetch("/api/acwr")
              .then((r) => r.json())
              .then((data) => setAcwrData(data.players ?? []))
              .catch(() => {})
          );
        }

        await Promise.all(promises);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchData();
  }, [user, hasRole]);

  // ─── Derived Data ─────────────────────────────────────────────────

  const injuryStats = useMemo(() => {
    const injured = injuryData.filter((p) =>
      p.injuries.some((i) => i.status === "En recuperación" || i.status === "Recaída")
    );
    const recentInjuries = injuryData
      .flatMap((p) =>
        p.injuries
          .filter((i) => i.status === "En recuperación" || i.status === "Recaída")
          .map((i) => ({ ...i, playerName: p.name }))
      )
      .sort((a, b) => new Date(b.dateOfInjury).getTime() - new Date(a.dateOfInjury).getTime())
      .slice(0, 5);
    return { injuredCount: injured.length, totalPlayers: injuryData.length, recentInjuries };
  }, [injuryData]);

  const acwrStats = useMemo(() => {
    const topPlayers = [...acwrData]
      .filter((p) => p.currentWeek)
      .sort((a, b) => (b.currentWeek?.totalDistance ?? 0) - (a.currentWeek?.totalDistance ?? 0))
      .slice(0, 5);
    const highRisk = acwrData.filter((p) => p.overallRisk === "alto").length;
    const optimal = acwrData.filter((p) => p.overallRisk === "optimo").length;
    return { topPlayers, highRisk, optimal, total: acwrData.length };
  }, [acwrData]);

  const roleGreeting: Record<string, string> = {
    medico: "Área Médica",
    gps: "Personal GPS",
    admin: "Administrador",
  };

  const severityColors: Record<string, string> = {
    Leve: "bg-green-100 text-green-800 border-green-200",
    Moderada: "bg-yellow-100 text-yellow-800 border-yellow-200",
    Grave: "bg-red-100 text-red-800 border-red-200",
  };

  const positionLabels: Record<string, string> = {
    PORTERO: "Portero",
    DEFENSA: "Defensa",
    MEDIOCAMPISTA: "Mediocampista",
    DELANTERO: "Delantero",
  };

  if (!user) return null;

  return (
    <div className="flex flex-col bg-white min-h-full">
      {/* ─── Hero Header ─────────────────────────────────────────── */}
      <header className="border-b border-slate-200 bg-gradient-to-r from-[#0085CB]/5 via-white to-transparent px-4 py-6 md:px-8 md:py-8">
        <p className="text-xs md:text-sm font-bold text-[#0085CB] uppercase tracking-widest mb-1">
          {roleGreeting[user.role] ?? "Bienvenido"}
        </p>
        <h1 className="text-2xl md:text-4xl font-black tracking-tight text-slate-900">
          Hola, {user.name || user.email.split("@")[0]} 👋
        </h1>
        <p className="mt-1 md:mt-2 text-xs md:text-sm font-medium text-slate-500 capitalize">
          {getTodayFormatted()}
        </p>
      </header>

      {/* ─── Content ─────────────────────────────────────────────── */}
      <div className="flex-1 p-4 md:p-8 space-y-6 md:space-y-8 pb-20 md:pb-8">
        {loading ? (
          <HuachipatoLoader />
        ) : (
          <>
            {/* ══════════════════════════════════════════════════════
                MÉDICO WELCOME
               ══════════════════════════════════════════════════════ */}
            {hasRole("medico") && (
              <div className="space-y-6 md:space-y-8">
                {/* KPIs */}
                <div className="grid grid-cols-3 gap-3 md:gap-4">
                  <KpiCard icon="personal_injury" label="Lesionados" value={injuryStats.injuredCount} accent="rose" />
                  <KpiCard icon="groups" label="Plantel" value={injuryStats.totalPlayers} accent="blue" />
                  <KpiCard icon="check_circle" label="Sanos" value={injuryStats.totalPlayers - injuryStats.injuredCount} accent="emerald" />
                </div>

                {/* Recent Injuries */}
                {injuryStats.recentInjuries.length > 0 && (
                  <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="bg-slate-50 px-4 md:px-6 py-3 md:py-4 border-b border-slate-100">
                      <h2 className="text-sm md:text-lg font-bold text-slate-900 flex items-center gap-2">
                        <span className="material-symbols-outlined text-rose-500 text-lg md:text-xl">warning</span>
                        Lesiones Activas Recientes
                      </h2>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {injuryStats.recentInjuries.map((injury) => (
                        <InjuryRow key={injury.id} injury={injury} severityColors={severityColors} />
                      ))}
                    </div>
                    <Link
                      href="/medico"
                      className="flex items-center justify-center gap-2 px-4 py-3 border-t border-slate-100 text-xs font-bold text-[#0085CB] hover:bg-[#0085CB]/5 transition-colors"
                    >
                      Ver todas las fichas clínicas
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </Link>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <QuickAction href="/medico" icon="medical_services" label="Panel Médico" description="Fichas clínicas y lesiones" variant="rose" />
                  <QuickAction href="/jugadores" icon="groups" label="Ver Jugadores" description="Consultar el plantel" variant="blue" />
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════
                GPS WELCOME
               ══════════════════════════════════════════════════════ */}
            {hasRole("gps") && (
              <div className="space-y-6 md:space-y-8">
                {/* KPIs */}
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
                  <KpiCard icon="groups" label="Jugadores" value={acwrStats.total} sub="registrados" accent="blue" />
                  <KpiCard icon="check_circle" label="Óptimo" value={acwrStats.optimal} sub="en sweet spot" accent="emerald" />
                  <KpiCard icon="error" label="Alto Riesgo" value={acwrStats.highRisk} sub="sobrecarga" accent="rose" />
                  <KpiCard
                    icon="directions_run"
                    label="Dist. Promedio"
                    value={
                      acwrStats.total > 0
                        ? `${(acwrData.reduce((sum, p) => sum + (p.currentWeek?.totalDistance ?? 0), 0) / acwrStats.total / 1000).toFixed(1)} km`
                        : "—"
                    }
                    sub="semanal por jugador"
                    accent="amber"
                  />
                </div>

                {/* Top Players */}
                {acwrStats.topPlayers.length > 0 && (
                  <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="bg-slate-50 px-4 md:px-6 py-3 md:py-4 border-b border-slate-100">
                      <h2 className="text-sm md:text-lg font-bold text-slate-900 flex items-center gap-2">
                        <span className="material-symbols-outlined text-amber-500 text-lg md:text-xl">emoji_events</span>
                        Top Distancia Semanal
                      </h2>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {acwrStats.topPlayers.map((player, index) => (
                        <div key={player.playerId} className="px-4 md:px-6 py-3 md:py-4 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className={`flex size-8 md:size-10 shrink-0 items-center justify-center rounded-full font-black text-xs md:text-sm ${
                              index === 0 ? "bg-amber-100 text-amber-700" :
                              index === 1 ? "bg-slate-100 text-slate-600" :
                              "bg-orange-50 text-orange-600"
                            }`}>
                              {index + 1}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 text-sm truncate">{player.playerName}</p>
                              <p className="text-[10px] md:text-xs text-slate-500">{positionLabels[player.position] ?? player.position}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 md:gap-3 shrink-0">
                            <span className="text-sm md:text-lg font-black text-slate-800">
                              {((player.currentWeek?.totalDistance ?? 0) / 1000).toFixed(1)} km
                            </span>
                            <AcwrBadge risk={player.overallRisk} />
                          </div>
                        </div>
                      ))}
                    </div>
                    <Link
                      href="/monitor"
                      className="flex items-center justify-center gap-2 px-4 py-3 border-t border-slate-100 text-xs font-bold text-[#0085CB] hover:bg-[#0085CB]/5 transition-colors"
                    >
                      Ver Monitor ACS completo
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </Link>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                  <QuickAction href="/monitor" icon="monitoring" label="Monitor ACS" description="Tabla completa de cargas" variant="blue" />
                  <QuickAction href="/ingesta" icon="cloud_upload" label="Subir Datos" description="Importar CSV/Excel GPS" variant="emerald" />
                  <QuickAction href="/resumen" icon="calendar_today" label="Resumen Diario" description="Métricas diarias y semanales" variant="amber" />
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════
                ADMIN WELCOME
               ══════════════════════════════════════════════════════ */}
            {hasRole("admin") && (
              <div className="space-y-6 md:space-y-8">
                {/* KPIs */}
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
                  <KpiCard icon="groups" label="Jugadores" value={acwrStats.total || injuryStats.totalPlayers} sub="en el plantel" accent="blue" />
                  <KpiCard icon="personal_injury" label="Lesionados" value={injuryStats.injuredCount} sub="activos" accent="rose" />
                  <KpiCard icon="error" label="Riesgo ACS" value={acwrStats.highRisk} sub="alto riesgo" accent="amber" />
                  <KpiCard icon="check_circle" label="ACS Óptimo" value={acwrStats.optimal} sub="en sweet spot" accent="emerald" />
                </div>

                {/* Two columns: Injuries + ACS Risk */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {/* Injuries */}
                  <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="bg-slate-50 px-4 md:px-5 py-3 border-b border-slate-100">
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span className="material-symbols-outlined text-base text-rose-500">warning</span>
                        Lesiones Activas
                      </h3>
                    </div>
                    {injuryStats.recentInjuries.length > 0 ? (
                      <div className="divide-y divide-slate-100">
                        {injuryStats.recentInjuries.map((inj) => (
                          <div key={inj.id} className="px-4 md:px-5 py-3 flex items-center justify-between gap-2 text-sm">
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-slate-800 text-sm truncate">{inj.playerName}</p>
                              <p className="text-[10px] text-slate-400 truncate">{inj.injuryType}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${severityColors[inj.severity] ?? ""}`}>
                              {inj.severity}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 text-center text-xs text-slate-400">
                        <span className="material-symbols-outlined text-2xl text-slate-300 block mb-1">check_circle</span>
                        Sin lesiones activas
                      </div>
                    )}
                    <Link
                      href="/medico"
                      className="flex items-center justify-center gap-2 px-4 py-2.5 border-t border-slate-100 text-[10px] md:text-xs font-bold text-[#0085CB] hover:bg-[#0085CB]/5 transition-colors"
                    >
                      Ver Panel Médico
                      <span className="material-symbols-outlined text-xs">arrow_forward</span>
                    </Link>
                  </div>

                  {/* ACS Risk Overview */}
                  <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="bg-slate-50 px-4 md:px-5 py-3 border-b border-slate-100">
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span className="material-symbols-outlined text-base text-rose-500">error</span>
                        Alto Riesgo ACS
                      </h3>
                    </div>
                    {acwrData.filter((p) => p.overallRisk === "alto").length > 0 ? (
                      <div className="divide-y divide-slate-100">
                        {acwrData.filter((p) => p.overallRisk === "alto").slice(0, 5).map((p) => (
                          <div key={p.playerId} className="px-4 md:px-5 py-3 flex items-center justify-between gap-2 text-sm">
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-slate-800 text-sm truncate">{p.playerName}</p>
                              <p className="text-[10px] text-slate-400">{positionLabels[p.position] ?? p.position}</p>
                            </div>
                            <AcwrBadge risk={p.overallRisk} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 text-center text-xs text-slate-400">
                        <span className="material-symbols-outlined text-2xl text-emerald-300 block mb-1">check_circle</span>
                        Sin jugadores en alto riesgo
                      </div>
                    )}
                    <Link
                      href="/monitor"
                      className="flex items-center justify-center gap-2 px-4 py-2.5 border-t border-slate-100 text-[10px] md:text-xs font-bold text-[#0085CB] hover:bg-[#0085CB]/5 transition-colors"
                    >
                      Ver Monitor ACS
                      <span className="material-symbols-outlined text-xs">arrow_forward</span>
                    </Link>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
                  <QuickAction href="/monitor" icon="monitoring" label="Monitor ACS" description="Tabla de cargas" variant="blue" />
                  <QuickAction href="/medico" icon="medical_services" label="Panel Médico" description="Fichas clínicas" variant="rose" />
                  <QuickAction href="/jugadores" icon="groups" label="Jugadores" description="Gestión del plantel" variant="emerald" />
                  <QuickAction href="/admin/usuarios" icon="admin_panel_settings" label="Usuarios" description="Administrar personal" variant="violet" />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

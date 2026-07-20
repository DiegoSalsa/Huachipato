"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth, UserRole } from "@/components/AuthContext";
import { SQUADS, SQUAD_LABELS, type Squad } from "@/lib/squads";

interface NavItem {
  href: string;
  icon: string;
  label: string;
  mobileLabel: string;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  { href: "/", icon: "home", label: "Inicio", mobileLabel: "Inicio", roles: ["medico", "gps", "admin"] },
  { href: "/monitor", icon: "monitoring", label: "Monitor ACS", mobileLabel: "ACS", roles: ["gps", "admin"] },
  { href: "/resumen", icon: "calendar_today", label: "Resumen Diario", mobileLabel: "Resumen", roles: ["gps", "admin"] },
  { href: "/jugadores", icon: "groups", label: "Jugadores", mobileLabel: "Jugadores", roles: ["medico", "gps", "admin"] },
  { href: "/medico", icon: "medical_services", label: "Panel Médico", mobileLabel: "Médico", roles: ["medico", "admin"] },
  { href: "/ingesta", icon: "cloud_upload", label: "Ingesta de Datos", mobileLabel: "Ingesta", roles: ["gps"] },
  { href: "/admin/usuarios", icon: "admin_panel_settings", label: "Administrar Usuarios", mobileLabel: "Usuarios", roles: ["admin"] },
];

const roleEtiquetas: Record<UserRole, { label: string; color: string }> = {
  medico: { label: "Área Médica", color: "bg-emerald-500/20 text-emerald-300" },
  gps: { label: "Personal GPS", color: "bg-sky-500/20 text-sky-300" },
  admin: { label: "Administrador", color: "bg-amber-500/20 text-amber-300" },
};

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout, activeSquad, canSwitchSquad, setActiveSquad } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);

  const userRole = user?.role as UserRole | undefined;
  const filteredItems = userRole
    ? navItems.filter((item) => item.roles.includes(userRole))
    : [];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const roleInfo = userRole ? roleEtiquetas[userRole] : null;
  const mobilePrimaryItems = filteredItems.slice(0, 4);
  const mobileMoreItems = filteredItems.slice(4);
  const moreIsActive = mobileMoreItems.some((item) => isActive(item.href));

  return (
    <>
      {/* Barra lateral de escritorio */}
      <aside className="hidden md:flex w-64 flex-shrink-0 bg-sidebar border-r border-white/10 flex-col text-white">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center overflow-hidden">
          <Image
            className="h-full w-full object-cover"
            alt="Logotipo Oficial Club Huachipato"
            src="https://pbs.twimg.com/media/G72bIFRXwAAZ2AC.jpg"
            width={40}
            height={40}
          />
        </div>
        <div>
          <h1 className="text-sm font-bold uppercase tracking-wider">Huachipato</h1>
          <p className="text-[10px] text-white/70 font-medium">Analytics Suite</p>
        </div>
      </div>

      {/* Navegacion */}
      <div className="px-4 mb-2">
        {canSwitchSquad ? (
          <label className="block rounded-xl border border-white/15 bg-white/10 p-3">
            <span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-white/60">
              Serie activa
            </span>
            <select
              value={activeSquad ?? "PROFESIONAL"}
              onChange={(event) => setActiveSquad(event.target.value as Squad)}
              className="w-full rounded-lg border border-white/20 bg-[#07547b] px-2 py-2 text-xs font-bold text-white outline-none"
              aria-label="Cambiar serie activa"
            >
              {SQUADS.map((squad) => (
                <option key={squad} value={squad}>{SQUAD_LABELS[squad]}</option>
              ))}
            </select>
          </label>
        ) : activeSquad ? (
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Serie</p>
            <p className="mt-0.5 text-xs font-bold text-white">{SQUAD_LABELS[activeSquad]}</p>
          </div>
        ) : null}
      </div>
      <nav className="flex-1 px-4 space-y-1 mt-4">
        {filteredItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              isActive(item.href)
                ? "bg-white/20 text-white"
                : "text-white/80 hover:bg-white/10"
            }`}
          >
            <span className="material-symbols-outlined text-xl">{item.icon}</span>
            <span className={`text-sm ${isActive(item.href) ? "font-semibold" : "font-medium"}`}>
              {item.label}
            </span>
          </Link>
        ))}
      </nav>

      {/* Datos del usuario y cierre de sesion */}
      <div className="p-4 border-t border-white/10 space-y-3">
        {user && (
          <div className="px-3 py-2 text-white/80 text-xs">
            <p className="font-medium truncate">{user.name || user.email}</p>
            {roleInfo && (
              <span className={`inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${roleInfo.color}`}>
                {roleInfo.label}
              </span>
            )}
          </div>
        )}
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 transition-colors text-sm font-medium"
        >
          <span className="material-symbols-outlined text-xl">logout</span>
          <span>Cerrar Sesión</span>
        </button>
        <div className="px-3 py-2 text-white/40 text-[10px] font-medium">
          Sistema ACS v2.0
        </div>
      </div>
      </aside>

      {/* Panel secundario movil */}
      {moreOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <button
            type="button"
            aria-label="Cerrar menú"
            className="absolute inset-0 bg-slate-950/35 backdrop-blur-[2px]"
            onClick={() => setMoreOpen(false)}
          />
          <section
            className="absolute inset-x-2 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl"
            style={{ bottom: "calc(4.75rem + env(safe-area-inset-bottom))", maxHeight: "min(70vh, 34rem)" }}
            aria-label="Más opciones"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">{user?.name || user?.email}</p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  {roleInfo && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">{roleInfo.label}</span>}
                  {activeSquad && <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700">{SQUAD_LABELS[activeSquad]}</span>}
                </div>
              </div>
              <button type="button" onClick={() => setMoreOpen(false)} className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500" aria-label="Cerrar menú">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {mobileMoreItems.length > 0 && (
              <div className="mb-4 grid grid-cols-2 gap-2">
                {mobileMoreItems.map((item) => (
                  <Link key={item.href} href={item.href} onClick={() => setMoreOpen(false)} className={`flex min-h-14 items-center gap-3 rounded-xl border px-3 py-2 text-sm font-bold ${isActive(item.href) ? "border-sky-200 bg-sky-50 text-[#006195]" : "border-slate-200 text-slate-700"}`}>
                    <span className="material-symbols-outlined text-xl">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            )}

            {canSwitchSquad && (
              <label className="mb-3 block rounded-xl border border-slate-200 bg-slate-50 p-3">
                <span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-500">Serie activa</span>
                <select value={activeSquad ?? "PROFESIONAL"} onChange={(event) => setActiveSquad(event.target.value as Squad)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-800 outline-none" aria-label="Cambiar serie activa">
                  {SQUADS.map((squad) => <option key={squad} value={squad}>{SQUAD_LABELS[squad]}</option>)}
                </select>
              </label>
            )}

            <button type="button" onClick={logout} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              <span className="material-symbols-outlined text-xl">logout</span>
              Cerrar sesión
            </button>
          </section>
        </div>
      )}

      {/* Navegacion inferior movil */}
      <nav className="md:hidden fixed inset-x-0 bottom-0 z-50 border-t border-slate-200/80 bg-white/95 px-1 pt-1 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur-xl" style={{ paddingBottom: "max(0.35rem, env(safe-area-inset-bottom))" }} aria-label="Navegación principal">
        <div className="mx-auto flex max-w-lg items-stretch justify-around">
        {mobilePrimaryItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMoreOpen(false)}
            aria-current={isActive(item.href) ? "page" : undefined}
            className={`relative flex min-h-[3.75rem] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 transition-colors ${
              isActive(item.href)
                ? "bg-sky-50 text-[#006195]"
                : "text-slate-500 active:bg-slate-100"
            }`}
          >
            {isActive(item.href) && <span className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-[#0085CB]" />}
            <span className="material-symbols-outlined text-[1.35rem] leading-none">{item.icon}</span>
            <span className="w-full truncate text-center text-[9px] font-bold leading-tight">{item.mobileLabel}</span>
          </Link>
        ))}
        <button
          type="button"
          onClick={() => setMoreOpen((open) => !open)}
          aria-expanded={moreOpen}
          aria-label="Más opciones"
          className={`relative flex min-h-[3.75rem] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 transition-colors ${moreOpen || moreIsActive ? "bg-sky-50 text-[#006195]" : "text-slate-500 active:bg-slate-100"}`}
        >
          {(moreOpen || moreIsActive) && <span className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-[#0085CB]" />}
          <span className="material-symbols-outlined text-[1.35rem] leading-none">more_horiz</span>
          <span className="text-center text-[9px] font-bold leading-tight">Más</span>
        </button>
        </div>
      </nav>
    </>
  );
}

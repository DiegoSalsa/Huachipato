"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth, UserRole } from "@/components/AuthContext";

interface NavItem {
  href: string;
  icon: string;
  label: string;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  { href: "/", icon: "home", label: "Inicio", roles: ["medico", "gps", "admin"] },
  { href: "/monitor", icon: "monitoring", label: "Monitor ACS", roles: ["gps", "admin"] },
  { href: "/resumen", icon: "calendar_today", label: "Resumen Diario", roles: ["gps", "admin"] },
  { href: "/jugadores", icon: "groups", label: "Jugadores", roles: ["medico", "gps", "admin"] },
  { href: "/medico", icon: "medical_services", label: "Panel Médico", roles: ["medico", "admin"] },
  { href: "/ingesta", icon: "cloud_upload", label: "Ingesta de Datos", roles: ["gps"] },
  { href: "/admin/usuarios", icon: "admin_panel_settings", label: "Administrar Usuarios", roles: ["admin"] },
];

const roleLabels: Record<UserRole, { label: string; color: string }> = {
  medico: { label: "Área Médica", color: "bg-emerald-500/20 text-emerald-300" },
  gps: { label: "Personal GPS", color: "bg-sky-500/20 text-sky-300" },
  admin: { label: "Administrador", color: "bg-amber-500/20 text-amber-300" },
};

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const userRole = user?.role as UserRole | undefined;
  const filteredItems = userRole
    ? navItems.filter((item) => item.roles.includes(userRole))
    : [];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const roleInfo = userRole ? roleLabels[userRole] : null;

  return (
    <>
      {/* Desktop Sidebar */}
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

      {/* Navigation */}
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

      {/* Bottom - User Info & Logout */}
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

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-sidebar flex items-center justify-around p-2 z-50 border-t border-white/10" style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>
        {filteredItems.slice(0, 5).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 py-2.5 px-3 rounded-lg transition-colors min-h-[44px] ${
              isActive(item.href)
                ? "text-white"
                : "text-white/60 hover:text-white/80"
            }`}
          >
            <span className="material-symbols-outlined text-xl">{item.icon}</span>
            <span className="text-[10px] font-medium leading-none w-16 text-center truncate">{item.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}

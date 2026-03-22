"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  icon: string;
  label: string;
}

const navItems: NavItem[] = [
  { href: "/", icon: "dashboard", label: "Panel Principal" },
  { href: "/jugadores", icon: "groups", label: "Jugadores" },
  { href: "/medico", icon: "medical_services", label: "Médico y Lesiones" },
  { href: "/rendimiento", icon: "analytics", label: "Rendimiento" },
  { href: "/ingesta", icon: "cloud_upload", label: "Ingesta de Datos" },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

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
          <p className="text-[10px] text-white/70 font-medium">Análisis Deportivo</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1 mt-4">
        {navItems.map((item) => (
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

      {/* Bottom */}
      <div className="p-4 border-t border-white/10">
        <Link
          href="/configuracion"
          className="flex items-center gap-3 px-3 py-2 text-white/80 hover:bg-white/10 rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined text-xl">settings</span>
          <span className="text-sm font-medium">Configuración</span>
        </Link>
      </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-sidebar flex items-center justify-around p-2 z-50 border-t border-white/10">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
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

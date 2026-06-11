"use client";

import { useState } from "react";
import RoleGuard from "@/components/RoleGuard";

interface MockUser {
  id: string;
  name: string;
  email: string;
  role: "medico" | "gps";
  status: "activo" | "pendiente";
  createdAt: string;
}

const initialMockUsers: MockUser[] = [
  { id: "1", name: "Dr. Roberto Sánchez", email: "r.sanchez@huachipato.cl", role: "medico", status: "activo", createdAt: "2025-03-15" },
  { id: "2", name: "Carlos Medina", email: "c.medina@huachipato.cl", role: "gps", status: "activo", createdAt: "2025-04-01" },
  { id: "3", name: "Dra. Valentina Rojas", email: "v.rojas@huachipato.cl", role: "medico", status: "activo", createdAt: "2025-05-20" },
  { id: "4", name: "Felipe Contreras", email: "f.contreras@huachipato.cl", role: "gps", status: "pendiente", createdAt: "2026-06-01" },
];

const roleLabels: Record<string, { label: string; icon: string; color: string }> = {
  medico: { label: "Área Médica", icon: "medical_services", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  gps: { label: "Personal GPS", icon: "satellite_alt", color: "bg-sky-100 text-sky-700 border-sky-200" },
};

export default function AdminUsuariosPage() {
  const [users, setUsers] = useState<MockUser[]>(initialMockUsers);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<"medico" | "gps">("gps");
  const [showSuccess, setShowSuccess] = useState(false);

  const handleAddUser = () => {
    if (!newName.trim() || !newEmail.trim()) return;

    const newUser: MockUser = {
      id: String(Date.now()),
      name: newName.trim(),
      email: newEmail.trim(),
      role: newRole,
      status: "pendiente",
      createdAt: new Date().toISOString().split("T")[0],
    };

    setUsers((prev) => [newUser, ...prev]);
    setNewName("");
    setNewEmail("");
    setNewRole("gps");
    setShowModal(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 5000);
  };

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="flex flex-col bg-white min-h-full">
        {/* Header */}
        <header className="border-b border-slate-200 px-4 py-5 md:px-8 md:py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">
                Administrar Usuarios
              </h1>
              <p className="mt-1 text-xs md:text-sm font-medium text-slate-500">
                Gestiona el personal con acceso al sistema
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0085CB] px-5 py-2.5 text-sm font-bold text-white transition-all hover:opacity-90 shadow-lg shadow-[#0085CB]/20 w-full md:w-auto"
            >
              <span className="material-symbols-outlined text-base">person_add</span>
              Agregar Usuario
            </button>
          </div>
        </header>

        <div className="p-4 md:p-8 space-y-5 md:space-y-6 pb-20 md:pb-8">
          {/* Demo Banner */}
          <div className="rounded-xl border-2 border-dashed border-amber-300 bg-amber-50 p-4 flex items-start gap-3">
            <span className="material-symbols-outlined text-amber-600 text-xl shrink-0 mt-0.5">info</span>
            <div>
              <p className="text-sm font-bold text-amber-800">Modo Demo</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Esta sección es una vista previa. Cuando se configure el dominio, los usuarios agregados recibirán un correo 
                con una contraseña temporal que deberán cambiar en su primer inicio de sesión.
              </p>
            </div>
          </div>

          {/* Success Notification */}
          {showSuccess && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-3 animate-in fade-in">
              <span className="material-symbols-outlined text-emerald-600">check_circle</span>
              <div>
                <p className="text-sm font-bold text-emerald-800">Usuario agregado correctamente</p>
                <p className="text-xs text-emerald-600">
                  En producción, se enviará un correo con las credenciales temporales.
                </p>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            <div className="rounded-2xl border border-slate-200 p-3 md:p-4">
              <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-400">Total</p>
              <p className="mt-1 text-2xl md:text-3xl font-black text-slate-900">{users.length}</p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3 md:p-4">
              <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-emerald-700">Médicos</p>
              <p className="mt-1 text-2xl md:text-3xl font-black text-emerald-700">{users.filter((u) => u.role === "medico").length}</p>
            </div>
            <div className="rounded-2xl border border-sky-200 bg-sky-50/60 p-3 md:p-4">
              <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-sky-700">GPS</p>
              <p className="mt-1 text-2xl md:text-3xl font-black text-sky-700">{users.filter((u) => u.role === "gps").length}</p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-3 md:p-4">
              <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-amber-700">Pendientes</p>
              <p className="mt-1 text-2xl md:text-3xl font-black text-amber-700">{users.filter((u) => u.status === "pendiente").length}</p>
            </div>
          </div>

          {/* Users Table */}
          <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Personal Registrado</h2>
              <p className="text-xs text-slate-500">Listado de usuarios con acceso al sistema</p>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="px-6 py-3">Usuario</th>
                    <th className="px-6 py-3">Correo</th>
                    <th className="px-6 py-3">Rol</th>
                    <th className="px-6 py-3">Estado</th>
                    <th className="px-6 py-3">Fecha Registro</th>
                    <th className="px-6 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => {
                    const rl = roleLabels[u.role];
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="size-9 rounded-full bg-[#0085CB]/10 flex items-center justify-center text-sm font-bold text-[#0085CB]">
                              {u.name.charAt(0)}
                            </div>
                            <span className="font-semibold text-slate-900">{u.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500">{u.email}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${rl.color}`}>
                            <span className="material-symbols-outlined text-xs">{rl.icon}</span>
                            {rl.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                            u.status === "activo"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}>
                            <span className="size-1.5 rounded-full bg-current" />
                            {u.status === "activo" ? "Activo" : "Pendiente"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-xs">
                          {new Date(u.createdAt + "T12:00:00").toLocaleDateString("es-CL", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600">
                            <span className="material-symbols-outlined text-lg">more_vert</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-slate-100">
              {users.map((u) => {
                const rl = roleLabels[u.role];
                return (
                  <div key={u.id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-[#0085CB]/10 flex items-center justify-center text-sm font-bold text-[#0085CB]">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">{u.name}</p>
                          <p className="text-xs text-slate-400">{u.email}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        u.status === "activo"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}>
                        {u.status === "activo" ? "Activo" : "Pendiente"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${rl.color}`}>
                        <span className="material-symbols-outlined text-[10px]">{rl.icon}</span>
                        {rl.label}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(u.createdAt + "T12:00:00").toLocaleDateString("es-CL")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ─── ADD USER MODAL ──────────────────────────────── */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-[#0085CB]/10">
                    <span className="material-symbols-outlined text-xl text-[#0085CB]">person_add</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Agregar Usuario</h3>
                    <p className="text-xs text-slate-500">Se enviará un correo con acceso temporal</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-lg p-1 hover:bg-slate-100 transition-colors"
                >
                  <span className="material-symbols-outlined text-slate-500">close</span>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.13em] text-slate-500">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Ej: Dr. Juan Pérez"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-[#0085CB] focus:ring-2 focus:ring-[#0085CB]/20"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.13em] text-slate-500">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="usuario@huachipato.cl"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-[#0085CB] focus:ring-2 focus:ring-[#0085CB]/20"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.13em] text-slate-500">
                    Rol
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setNewRole("medico")}
                      className={`flex items-center gap-2 rounded-xl border-2 p-3 text-sm font-bold transition-all ${
                        newRole === "medico"
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">medical_services</span>
                      Área Médica
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewRole("gps")}
                      className={`flex items-center gap-2 rounded-xl border-2 p-3 text-sm font-bold transition-all ${
                        newRole === "gps"
                          ? "border-sky-500 bg-sky-50 text-sky-700"
                          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">satellite_alt</span>
                      Personal GPS
                    </button>
                  </div>
                </div>

                {/* Info banner about email flow */}
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 flex items-start gap-2">
                  <span className="material-symbols-outlined text-slate-400 text-base mt-0.5">mail</span>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Al confirmar, se enviará un correo a <strong>{newEmail || "la dirección indicada"}</strong> con
                    una contraseña temporal. El usuario deberá cambiarla al ingresar por primera vez.
                  </p>
                </div>

                <button
                  onClick={handleAddUser}
                  disabled={!newName.trim() || !newEmail.trim()}
                  className="w-full rounded-xl bg-[#0085CB] py-3 text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">send</span>
                  Enviar Invitación
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}

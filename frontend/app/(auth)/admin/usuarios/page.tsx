"use client";

import { useCallback, useEffect, useState } from "react";
import RoleGuard from "@/components/RoleGuard";
import { SQUADS, SQUAD_LABELS, type Squad } from "@/lib/squads";

type ManagedRole = "medico" | "gps";

interface ManagedUser {
  id: string;
  name: string | null;
  email: string;
  role: ManagedRole | "admin";
  squad: Squad;
  createdAt: string;
}

const roleLabels: Record<ManagedUser["role"], string> = {
  medico: "Área Médica",
  gps: "Personal GPS",
  admin: "Administrador",
};

const emptyForm = {
  name: "",
  email: "",
  password: "",
  role: "gps" as ManagedRole,
  squad: "PROFESIONAL" as Squad,
};

const inputClass = "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-[#0085CB] focus:ring-2 focus:ring-[#0085CB]/20";

export default function AdminUsuariosPage() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/users");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudieron cargar los usuarios");
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los usuarios");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo crear el usuario");
      setUsers((current) => [data, ...current]);
      setForm(emptyForm);
      setShowModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el usuario");
    } finally {
      setSaving(false);
    }
  };

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="min-h-full bg-white">
        <header className="border-b border-slate-200 px-4 py-5 md:px-8 md:py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl">Administrar usuarios</h1>
              <p className="mt-1 text-sm font-medium text-slate-500">Asigna cada usuario a un rol y una serie específica.</p>
            </div>
            <button
              onClick={() => { setError(""); setShowModal(true); }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0085CB] px-5 py-2.5 text-sm font-bold text-white"
            >
              <span className="material-symbols-outlined text-base">person_add</span>
              Agregar usuario
            </button>
          </div>
        </header>

        <div className="p-4 md:p-8">
          {error && !showModal && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</div>
          )}

          <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Total" value={users.length} />
            <Stat label="Médicos" value={users.filter((user) => user.role === "medico").length} />
            <Stat label="GPS" value={users.filter((user) => user.role === "gps").length} />
            <Stat label="Series con personal" value={new Set(users.filter((user) => user.role !== "admin").map((user) => user.squad)).size} />
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
            <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
              <h2 className="font-bold text-slate-900">Personal registrado</h2>
            </div>
            {loading ? (
              <p className="p-8 text-center text-sm text-slate-500">Cargando usuarios...</p>
            ) : users.length === 0 ? (
              <p className="p-8 text-center text-sm text-slate-500">No hay usuarios registrados.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3">Usuario</th>
                      <th className="px-5 py-3">Correo</th>
                      <th className="px-5 py-3">Rol</th>
                      <th className="px-5 py-3">Serie asignada</th>
                      <th className="px-5 py-3">Registro</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-5 py-4 font-semibold text-slate-900">{user.name || "Sin nombre"}</td>
                        <td className="px-5 py-4 text-slate-500">{user.email}</td>
                        <td className="px-5 py-4"><Badge>{roleLabels[user.role]}</Badge></td>
                        <td className="px-5 py-4"><Badge>{user.role === "admin" ? "Todas (selector)" : SQUAD_LABELS[user.squad]}</Badge></td>
                        <td className="px-5 py-4 text-xs text-slate-500">{new Date(user.createdAt).toLocaleDateString("es-CL")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <form onSubmit={handleCreate} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
              <div className="mb-5 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Agregar usuario</h3>
                  <p className="text-xs text-slate-500">El acceso quedará limitado a la serie asignada.</p>
                </div>
                <button type="button" onClick={() => setShowModal(false)} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Nombre completo">
                  <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
                </Field>
                <Field label="Correo">
                  <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} />
                </Field>
                <Field label="Rol">
                  <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as ManagedRole })} className={inputClass}>
                    <option value="gps">Personal GPS</option>
                    <option value="medico">Área Médica</option>
                  </select>
                </Field>
                <Field label="Serie">
                  <select value={form.squad} onChange={(e) => setForm({ ...form, squad: e.target.value as Squad })} className={inputClass}>
                    {SQUADS.map((squad) => <option key={squad} value={squad}>{SQUAD_LABELS[squad]}</option>)}
                  </select>
                </Field>
                <div className="md:col-span-2">
                  <Field label="Contraseña temporal">
                    <input required minLength={8} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputClass} placeholder="Mínimo 8 caracteres" />
                  </Field>
                </div>
              </div>

              <button disabled={saving} className="mt-6 w-full rounded-xl bg-[#0085CB] py-3 text-sm font-bold text-white disabled:opacity-50">
                {saving ? "Creando..." : "Crear usuario"}
              </button>
            </form>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl border border-slate-200 p-4"><p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p><p className="mt-1 text-2xl font-black text-slate-900">{value}</p></div>;
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700">{children}</span>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>{children}</label>;
}

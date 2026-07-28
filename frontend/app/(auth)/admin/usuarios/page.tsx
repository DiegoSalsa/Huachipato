"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import RoleGuard from "@/components/RoleGuard";
import { SQUADS, SQUAD_LABELS, type Squad } from "@/lib/squads";

type ManagedRole = "medico" | "gps" | "admin";
type UserStatus = "PENDING" | "ACTIVE" | "BLOCKED";

interface ManagedUser {
  id: string;
  name: string | null;
  email: string;
  role: ManagedRole;
  squad: Squad;
  status: UserStatus;
  lastInviteSentAt: string | null;
  activatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const roleLabels: Record<ManagedUser["role"], string> = {
  medico: "Área Médica",
  gps: "Personal GPS",
  admin: "Administrador",
};

const statusInfo: Record<UserStatus, { label: string; classes: string }> = {
  ACTIVE: { label: "Activo", classes: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  PENDING: { label: "Invitación pendiente", classes: "border-amber-200 bg-amber-50 text-amber-700" },
  BLOCKED: { label: "Bloqueado", classes: "border-red-200 bg-red-50 text-red-700" },
};

const emptyForm = {
  name: "",
  email: "",
  role: "gps" as ManagedRole,
  squad: "PROFESIONAL" as Squad,
};

const inputClass = "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-[#0085CB] focus:ring-2 focus:ring-[#0085CB]/20";

export default function AdminUsuariosPage() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<ManagedUser | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [squadFilter, setSquadFilter] = useState<"ALL" | Squad>("ALL");

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

  useEffect(() => { void loadUsers(); }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("es");
    return users.filter((user) => {
      const matchesQuery = !normalized || `${user.name ?? ""} ${user.email}`.toLocaleLowerCase("es").includes(normalized);
      const matchesSquad = squadFilter === "ALL" || user.role === "admin" || user.squad === squadFilter;
      return matchesQuery && matchesSquad;
    });
  }, [query, squadFilter, users]);

  const showMessage = (message: string) => {
    setNotice(message);
    setError("");
    window.setTimeout(() => setNotice(""), 5000);
  };

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
      setUsers((current) => [data.user, ...current]);
      setForm(emptyForm);
      setShowCreate(false);
      showMessage(data.message || "Usuario creado e invitación enviada");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el usuario");
    } finally {
      setSaving(false);
    }
  };

  const updateUser = async (user: ManagedUser, changes: Partial<Pick<ManagedUser, "name" | "role" | "squad" | "status">>) => {
    const response = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: changes.name ?? user.name,
        role: changes.role ?? user.role,
        squad: changes.squad ?? user.squad,
        status: changes.status ?? user.status,
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "No se pudo actualizar el usuario");
    setUsers((current) => current.map((item) => item.id === user.id ? data.user : item));
    return data;
  };

  const handleEdit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    setSaving(true);
    setError("");
    try {
      const data = await updateUser(editing, { name: form.name, role: form.role, squad: form.squad });
      setEditing(null);
      setForm(emptyForm);
      showMessage(data.message || "Usuario actualizado");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar el usuario");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (user: ManagedUser) => {
    setActionId(user.id);
    try {
      const nextStatus = user.status === "BLOCKED" ? "ACTIVE" : "BLOCKED";
      await updateUser(user, { status: nextStatus });
      showMessage(nextStatus === "ACTIVE" ? "Usuario habilitado" : "Usuario bloqueado");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cambiar el estado");
    } finally {
      setActionId("");
    }
  };

  const handleResend = async (user: ManagedUser) => {
    setActionId(user.id);
    setError("");
    try {
      const response = await fetch(`/api/admin/users/${user.id}/invite`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo reenviar la invitación");
      setUsers((current) => current.map((item) => item.id === user.id ? { ...item, lastInviteSentAt: data.lastInviteSentAt } : item));
      showMessage(data.message || "Invitación reenviada");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo reenviar la invitación");
    } finally {
      setActionId("");
    }
  };

  const handleDelete = async (user: ManagedUser) => {
    if (!window.confirm(`¿Eliminar definitivamente a ${user.name || user.email}?`)) return;
    setActionId(user.id);
    setError("");
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo eliminar el usuario");
      setUsers((current) => current.filter((item) => item.id !== user.id));
      showMessage(data.message || "Usuario eliminado");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar el usuario");
    } finally {
      setActionId("");
    }
  };

  const openCreate = () => {
    setForm(emptyForm);
    setEditing(null);
    setError("");
    setShowCreate(true);
  };

  const openEdit = (user: ManagedUser) => {
    if (user.role === "admin") return;
    setForm({ name: user.name || "", email: user.email, role: user.role, squad: user.squad });
    setEditing(user);
    setShowCreate(false);
    setError("");
  };

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="min-h-full bg-white">
        <header className="border-b border-slate-200 px-4 py-5 md:px-8 md:py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl">Administrar usuarios</h1>
              <p className="mt-1 text-sm font-medium text-slate-500">Invita y administra el acceso del personal por serie.</p>
            </div>
            <button onClick={openCreate} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0085CB] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-sky-600/15 md:w-auto md:py-2.5">
              <span className="material-symbols-outlined text-base">person_add</span>
              Invitar usuario
            </button>
          </div>
        </header>

        <div className="space-y-5 p-4 md:p-8">
          {error && !showCreate && !editing && <Alert type="error">{error}</Alert>}
          {notice && <Alert type="success">{notice}</Alert>}

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Total" value={users.length} />
            <Stat label="Activos" value={users.filter((user) => user.status === "ACTIVE").length} tone="emerald" />
            <Stat label="Pendientes" value={users.filter((user) => user.status === "PENDING").length} tone="amber" />
            <Stat label="Bloqueados" value={users.filter((user) => user.status === "BLOCKED").length} tone="red" />
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:flex-row">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg text-slate-400">search</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre o correo" className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#0085CB]" />
            </div>
            <select value={squadFilter} onChange={(event) => setSquadFilter(event.target.value as "ALL" | Squad)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none">
              <option value="ALL">Todas las series</option>
              {SQUADS.map((squad) => <option key={squad} value={squad}>{SQUAD_LABELS[squad]}</option>)}
            </select>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
            <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
              <h2 className="font-bold text-slate-900">Personal registrado</h2>
              <p className="text-xs text-slate-500">{filteredUsers.length} usuario{filteredUsers.length === 1 ? "" : "s"}</p>
            </div>
            {loading ? (
              <p className="p-8 text-center text-sm text-slate-500">Cargando usuarios...</p>
            ) : filteredUsers.length === 0 ? (
              <p className="p-8 text-center text-sm text-slate-500">No hay usuarios para mostrar.</p>
            ) : (
              <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[980px] text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3">Usuario</th>
                      <th className="px-5 py-3">Rol</th>
                      <th className="px-5 py-3">Serie</th>
                      <th className="px-5 py-3">Estado</th>
                      <th className="px-5 py-3">Último envío</th>
                      <th className="px-5 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((user) => {
                      const isAdmin = user.role === "admin";
                      const busy = actionId === user.id;
                      return (
                        <tr key={user.id} className="hover:bg-slate-50/70">
                          <td className="px-5 py-4">
                            <p className="font-semibold text-slate-900">{user.name || "Sin nombre"}</p>
                            <p className="text-xs text-slate-500">{user.email}</p>
                          </td>
                          <td className="px-5 py-4"><Badge>{roleLabels[user.role]}</Badge></td>
                          <td className="px-5 py-4 text-slate-600">{isAdmin ? "Todas" : SQUAD_LABELS[user.squad]}</td>
                          <td className="px-5 py-4"><StatusBadge status={user.status} /></td>
                          <td className="px-5 py-4 text-xs text-slate-500">{user.lastInviteSentAt ? formatDate(user.lastInviteSentAt) : "—"}</td>
                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-1.5">
                              {!isAdmin && <ActionButton icon="edit" label="Editar" disabled={busy} onClick={() => openEdit(user)} />}
                              {user.status === "PENDING" && <ActionButton icon="forward_to_inbox" label="Reenviar" disabled={busy} onClick={() => void handleResend(user)} />}
                              {!isAdmin && user.status !== "PENDING" && <ActionButton icon={user.status === "BLOCKED" ? "lock_open" : "block"} label={user.status === "BLOCKED" ? "Habilitar" : "Bloquear"} disabled={busy} onClick={() => void handleToggleStatus(user)} />}
                              {(!isAdmin || user.status === "PENDING") && <ActionButton icon="delete" label="Eliminar" danger disabled={busy} onClick={() => void handleDelete(user)} />}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="divide-y divide-slate-100 md:hidden">
                {filteredUsers.map((user) => {
                  const isAdmin = user.role === "admin";
                  const busy = actionId === user.id;
                  return (
                    <article key={user.id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-bold text-slate-900">{user.name || "Sin nombre"}</p>
                          <p className="truncate text-xs text-slate-500">{user.email}</p>
                        </div>
                        <StatusBadge status={user.status} />
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 text-xs">
                        <div><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Rol</p><p className="mt-0.5 font-semibold text-slate-700">{roleLabels[user.role]}</p></div>
                        <div><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Serie</p><p className="mt-0.5 font-semibold text-slate-700">{isAdmin ? "Todas" : SQUAD_LABELS[user.squad]}</p></div>
                        {user.lastInviteSentAt && <div className="col-span-2"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Última invitación</p><p className="mt-0.5 font-semibold text-slate-700">{formatDate(user.lastInviteSentAt)}</p></div>}
                      </div>
                      {(!isAdmin || user.status === "PENDING") && (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          {!isAdmin && <MobileAction icon="edit" label="Editar" disabled={busy} onClick={() => openEdit(user)} />}
                          {user.status === "PENDING" && <MobileAction icon="forward_to_inbox" label="Reenviar" disabled={busy} onClick={() => void handleResend(user)} />}
                          {!isAdmin && user.status !== "PENDING" && <MobileAction icon={user.status === "BLOCKED" ? "lock_open" : "block"} label={user.status === "BLOCKED" ? "Habilitar" : "Bloquear"} disabled={busy} onClick={() => void handleToggleStatus(user)} />}
                          <MobileAction icon="delete" label="Eliminar" danger disabled={busy} onClick={() => void handleDelete(user)} />
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
              </>
            )}
          </div>
        </div>

        {(showCreate || editing) && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-4">
            <form onSubmit={editing ? handleEdit : handleCreate} className="max-h-[calc(100dvh-1rem)] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:rounded-2xl sm:p-6">
              <div className="mb-5 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{editing ? "Editar usuario" : "Invitar usuario"}</h3>
                  <p className="text-xs text-slate-500">{editing ? "Actualiza su rol o serie asignada." : "Recibirá un correo para crear su contraseña."}</p>
                </div>
                <button type="button" onClick={() => { setShowCreate(false); setEditing(null); setError(""); }} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"><span className="material-symbols-outlined">close</span></button>
              </div>

              {error && <Alert type="error">{error}</Alert>}
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Field label="Nombre completo"><input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={inputClass} /></Field>
                <Field label="Correo"><input required type="email" disabled={!!editing} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-60`} /></Field>
                <Field label="Rol">
                  <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as ManagedRole })} className={inputClass}>
                    <option value="gps">Personal GPS</option><option value="medico">Área Médica</option><option value="admin">Administrador</option>
                  </select>
                </Field>
                <Field label="Serie">
                  <select disabled={form.role === "admin"} value={form.squad} onChange={(event) => setForm({ ...form, squad: event.target.value as Squad })} className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-60`}>
                    {form.role === "admin" && <option value="PROFESIONAL">Todas las series</option>}
                    {SQUADS.map((squad) => <option key={squad} value={squad}>{SQUAD_LABELS[squad]}</option>)}
                  </select>
                </Field>
              </div>
              {!editing && <div className="mt-4 flex gap-2 rounded-xl border border-sky-200 bg-sky-50 p-3 text-xs leading-5 text-sky-800"><span className="material-symbols-outlined text-lg">mail</span><span>La invitación vencerá en 48 horas. La cuenta quedará pendiente hasta que el usuario defina su contraseña.</span></div>}
              <button disabled={saving} className="mt-6 w-full rounded-xl bg-[#0085CB] py-3 text-sm font-bold text-white disabled:opacity-50">{saving ? "Guardando..." : editing ? "Guardar cambios" : "Crear y enviar invitación"}</button>
            </form>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" });
}

function Stat({ label, value, tone = "slate" }: { label: string; value: number; tone?: "slate" | "emerald" | "amber" | "red" }) {
  const colors = { slate: "border-slate-200 text-slate-900", emerald: "border-emerald-200 bg-emerald-50/50 text-emerald-700", amber: "border-amber-200 bg-amber-50/50 text-amber-700", red: "border-red-200 bg-red-50/50 text-red-700" };
  return <div className={`rounded-2xl border p-4 ${colors[tone]}`}><p className="text-[10px] font-bold uppercase tracking-widest opacity-60">{label}</p><p className="mt-1 text-2xl font-black">{value}</p></div>;
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700">{children}</span>;
}

function StatusBadge({ status }: { status: UserStatus }) {
  const info = statusInfo[status];
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${info.classes}`}><span className="size-1.5 rounded-full bg-current" />{info.label}</span>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>{children}</label>;
}

function Alert({ type, children }: { type: "error" | "success"; children: React.ReactNode }) {
  return <div className={`rounded-xl border p-3 text-sm font-medium ${type === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{children}</div>;
}

function ActionButton({ icon, label, onClick, disabled, danger = false }: { icon: string; label: string; onClick: () => void; disabled: boolean; danger?: boolean }) {
  return <button type="button" title={label} aria-label={label} onClick={onClick} disabled={disabled} className={`inline-flex size-9 items-center justify-center rounded-lg border transition-colors disabled:opacity-40 ${danger ? "border-red-200 text-red-600 hover:bg-red-50" : "border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800"}`}><span className="material-symbols-outlined text-lg">{icon}</span></button>;
}

function MobileAction({ icon, label, onClick, disabled, danger = false }: { icon: string; label: string; onClick: () => void; disabled: boolean; danger?: boolean }) {
  return <button type="button" onClick={onClick} disabled={disabled} className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold disabled:opacity-40 ${danger ? "border-red-200 bg-red-50 text-red-700" : "border-slate-200 bg-white text-slate-700"}`}><span className="material-symbols-outlined text-lg">{icon}</span>{label}</button>;
}

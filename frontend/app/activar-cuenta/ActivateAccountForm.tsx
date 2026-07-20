"use client";

import Link from "next/link";
import { useState } from "react";

export default function ActivateAccountForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!token) return setError("El enlace de invitación no es válido.");
    if (password.length < 8) return setError("La contraseña debe tener al menos 8 caracteres.");
    if (password !== confirmation) return setError("Las contraseñas no coinciden.");

    setLoading(true);
    try {
      const response = await fetch("/api/auth/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo activar la cuenta");
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo activar la cuenta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="bg-[#006195] px-7 py-6 text-white">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-100">Huachipato FC</p>
          <h1 className="mt-1 text-2xl font-black">Activar cuenta</h1>
        </div>
        <div className="p-7">
          {success ? (
            <div className="text-center">
              <span className="material-symbols-outlined text-5xl text-emerald-500">check_circle</span>
              <h2 className="mt-3 text-xl font-bold text-slate-900">Cuenta activada</h2>
              <p className="mt-2 text-sm text-slate-500">Tu contraseña quedó configurada. Ya puedes ingresar al sistema.</p>
              <Link href="/login" className="mt-6 inline-flex w-full justify-center rounded-xl bg-[#0085CB] py-3 text-sm font-bold text-white">Ir al inicio de sesión</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <p className="mb-6 text-sm leading-6 text-slate-500">Crea una contraseña segura para completar tu invitación.</p>
              {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">Nueva contraseña</span>
                <input type="password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#0085CB] focus:ring-2 focus:ring-[#0085CB]/20" />
              </label>
              <label className="mt-4 block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">Confirmar contraseña</span>
                <input type="password" required minLength={8} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#0085CB] focus:ring-2 focus:ring-[#0085CB]/20" />
              </label>
              <button disabled={loading || !token} className="mt-6 w-full rounded-xl bg-[#0085CB] py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{loading ? "Activando..." : "Activar mi cuenta"}</button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}

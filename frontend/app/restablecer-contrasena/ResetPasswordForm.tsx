"use client";

import Link from "next/link";
import { useState } from "react";

export default function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!token) return setError("El enlace no es válido. Solicita uno nuevo.");
    if (password.length < 8) return setError("La contraseña debe tener al menos 8 caracteres.");
    if (password !== confirmation) return setError("Las contraseñas no coinciden.");

    setLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "No se pudo actualizar la contraseña.");
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar la contraseña.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="bg-[#006195] px-6 py-6 text-white sm:px-7">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-100">Huachipato FC</p>
          <h1 className="mt-1 text-2xl font-black">Nueva contraseña</h1>
        </div>
        <div className="p-6 sm:p-7">
          {success ? (
            <div className="text-center">
              <span className="material-symbols-outlined text-5xl text-emerald-500">check_circle</span>
              <h2 className="mt-3 text-xl font-bold text-slate-900">Contraseña actualizada</h2>
              <p className="mt-2 text-sm text-slate-500">Ya puedes ingresar con tu nueva contraseña.</p>
              <Link href="/login" className="mt-6 inline-flex w-full justify-center rounded-xl bg-[#0085CB] py-3 text-sm font-bold text-white">
                Ir al inicio de sesión
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <p className="mb-6 text-sm leading-6 text-slate-500">Usa al menos 8 caracteres para proteger tu cuenta.</p>
              {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
              <PasswordField label="Nueva contraseña" value={password} show={showPassword} onChange={setPassword} />
              <div className="mt-4">
                <PasswordField label="Confirmar contraseña" value={confirmation} show={showPassword} onChange={setConfirmation} />
              </div>
              <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-600">
                <input type="checkbox" checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)} className="size-4 rounded border-slate-300 text-[#006195] focus:ring-[#006195]/20" />
                Mostrar contraseñas
              </label>
              <button disabled={loading || !token} className="mt-6 w-full rounded-xl bg-[#0085CB] py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
                {loading ? "Actualizando..." : "Guardar nueva contraseña"}
              </button>
              {!token && (
                <Link href="/recuperar-contrasena" className="mt-4 block text-center text-sm font-bold text-[#006195]">
                  Solicitar un enlace nuevo
                </Link>
              )}
            </form>
          )}
        </div>
      </div>
    </main>
  );
}

function PasswordField({
  label,
  value,
  show,
  onChange,
}: {
  label: string;
  value: string;
  show: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>
      <input
        type={show ? "text" : "password"}
        required
        minLength={8}
        autoComplete="new-password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base outline-none focus:border-[#0085CB] focus:ring-2 focus:ring-[#0085CB]/20"
      />
    </label>
  );
}

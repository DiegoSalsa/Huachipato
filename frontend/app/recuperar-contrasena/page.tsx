"use client";

import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "No se pudo procesar la solicitud.");
      setMessage(data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo procesar la solicitud.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="bg-[#006195] px-6 py-6 text-white sm:px-7">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-100">Huachipato FC</p>
          <h1 className="mt-1 text-2xl font-black">Recuperar contraseña</h1>
        </div>
        <div className="p-6 sm:p-7">
          {message ? (
            <div className="text-center">
              <span className="material-symbols-outlined text-5xl text-emerald-500">mark_email_read</span>
              <h2 className="mt-3 text-xl font-bold text-slate-900">Revisa tu correo</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">{message}</p>
              <Link href="/login" className="mt-6 inline-flex w-full justify-center rounded-xl bg-[#0085CB] py-3 text-sm font-bold text-white">
                Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <p className="mb-6 text-sm leading-6 text-slate-500">
                Ingresa el correo asociado a tu cuenta y te enviaremos un enlace para crear una nueva contraseña.
              </p>
              {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">Correo electrónico</span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="usuario@huachipato.cl"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base outline-none focus:border-[#0085CB] focus:ring-2 focus:ring-[#0085CB]/20"
                />
              </label>
              <button disabled={loading} className="mt-6 w-full rounded-xl bg-[#0085CB] py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
                {loading ? "Enviando..." : "Enviar enlace"}
              </button>
              <Link href="/login" className="mt-4 flex items-center justify-center gap-1 text-sm font-bold text-[#006195]">
                <span className="material-symbols-outlined text-lg">arrow_back</span>
                Volver al inicio de sesión
              </Link>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}

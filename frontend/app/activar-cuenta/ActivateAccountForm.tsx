"use client";

import Link from "next/link";
import { useState } from "react";
import { getPasswordError, MIN_PASSWORD_LENGTH } from "@/lib/password-policy";

export default function ActivateAccountForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const requirements = [
    { label: `${MIN_PASSWORD_LENGTH} caracteres`, met: password.length >= MIN_PASSWORD_LENGTH },
    { label: "Una mayúscula", met: /[A-Z]/.test(password) },
    { label: "Una minúscula", met: /[a-z]/.test(password) },
    { label: "Un número", met: /\d/.test(password) },
  ];

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!token) return setError("El enlace de invitación no es válido.");
    const passwordError = getPasswordError(password);
    if (passwordError) return setError(passwordError);
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
    <main className="flex min-h-dvh flex-col overflow-x-hidden md:flex-row">
      <section className="relative hidden items-center justify-center overflow-hidden bg-[#006195] md:flex md:w-[70%]">
        <div className="pointer-events-none absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "radial-gradient(circle at 20% 30%, #ffffff 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        <div className="relative z-10 flex max-w-4xl flex-col items-center px-12 text-center">
          <div className="mb-12">
            <img
              alt="Escudo de Huachipato FC"
              className="h-auto w-80 lg:w-96"
              src="/huachipato-logo.png"
            />
          </div>
          <h1 className="mb-4 text-5xl font-extrabold uppercase tracking-tight text-white">
            Huachipato Analytics
          </h1>
          <p className="text-lg uppercase tracking-wide text-blue-100 opacity-80">
            Sistema de Análisis Deportivo
          </p>
        </div>
      </section>

      <section className="relative z-20 flex w-full flex-1 flex-col justify-center bg-white px-5 py-8 shadow-[-24px_0_48px_rgba(13,28,46,0.04)] sm:px-8 md:w-[30%] md:flex-none md:px-12 md:py-12">
        <div className="mb-7 flex justify-center md:hidden">
          <img
            alt="Escudo de Huachipato FC"
            className="h-auto w-24 sm:w-28"
            src="/huachipato-logo.png"
          />
        </div>

        <div className="mx-auto w-full max-w-sm">
          {success ? (
            <div>
              <div className="mb-6 flex size-14 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <span className="material-symbols-outlined text-4xl">check_circle</span>
              </div>
              <header className="mb-8">
                <h2 className="mb-2 text-3xl font-bold tracking-tight text-on-surface">
                  Cuenta activada
                </h2>
                <p className="text-sm font-medium leading-6 text-on-surface-variant">
                  Tu contraseña quedó configurada. Ya puedes ingresar al sistema de analítica oficial.
                </p>
              </header>
              <Link
                href="/login"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#006195] px-6 py-4 font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-container active:scale-95"
              >
                Ingresar
                <span className="material-symbols-outlined text-xl">login</span>
              </Link>
            </div>
          ) : (
            <>
              <header className="mb-8">
                <h2 className="mb-2 text-3xl font-bold tracking-tight text-on-surface">
                  Activar cuenta
                </h2>
                <p className="text-sm font-medium text-on-surface-variant">
                  Crea tu contraseña para ingresar a Huachipato Analytics.
                </p>
              </header>

              <form className="space-y-5" onSubmit={handleSubmit}>
                {!token && (
                  <div className="flex gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
                    <span className="material-symbols-outlined text-xl">link_off</span>
                    Solicita al administrador un nuevo enlace de invitación.
                  </div>
                )}

                {error && (
                  <div role="alert" className="flex gap-3 rounded-lg border border-error bg-error-container p-4 text-sm text-error">
                    <span className="material-symbols-outlined text-xl">error</span>
                    {error}
                  </div>
                )}

                <PasswordInput
                  id="new-password"
                  label="Nueva contraseña"
                  value={password}
                  show={showPassword}
                  onChange={setPassword}
                  onToggle={() => setShowPassword((current) => !current)}
                />

                <PasswordInput
                  id="confirm-password"
                  label="Confirmar contraseña"
                  value={confirmation}
                  show={showPassword}
                  onChange={setConfirmation}
                  onToggle={() => setShowPassword((current) => !current)}
                />

                <div className="rounded-lg bg-surface-container-low p-4">
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                    Requisitos de seguridad
                  </p>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                    {requirements.map((requirement) => (
                      <div
                        key={requirement.label}
                        className={`flex items-center gap-1.5 text-xs font-medium ${
                          requirement.met ? "text-emerald-600" : "text-outline"
                        }`}
                      >
                        <span className="material-symbols-outlined text-base">
                          {requirement.met ? "check_circle" : "radio_button_unchecked"}
                        </span>
                        {requirement.label}
                      </div>
                    ))}
                  </div>
                  {confirmation && (
                    <div
                      className={`mt-3 flex items-center gap-1.5 border-t border-outline-variant/30 pt-3 text-xs font-medium ${
                        password === confirmation ? "text-emerald-600" : "text-error"
                      }`}
                    >
                      <span className="material-symbols-outlined text-base">
                        {password === confirmation ? "check_circle" : "cancel"}
                      </span>
                      {password === confirmation
                        ? "Las contraseñas coinciden"
                        : "Las contraseñas no coinciden"}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !token}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#006195] px-6 py-4 font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-container active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span>{loading ? "Activando..." : "Activar cuenta"}</span>
                  <span className="material-symbols-outlined text-xl">login</span>
                </button>
              </form>

              <footer className="mt-10 border-t border-surface-container-low pt-6 text-center md:mt-12">
                <p className="text-xs font-medium text-outline">
                  Acceso restringido para personal técnico y directivo de
                  <br />
                  <span className="font-bold uppercase tracking-tight text-on-surface-variant">
                    Club Deportivo Huachipato
                  </span>
                </p>
              </footer>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

function PasswordInput({
  id,
  label,
  value,
  show,
  onChange,
  onToggle,
}: {
  id: string;
  label: string;
  value: string;
  show: boolean;
  onChange: (value: string) => void;
  onToggle: () => void;
}) {
  return (
    <div className="space-y-2">
      <label
        className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant"
        htmlFor={id}
      >
        {label}
      </label>
      <div className="group relative">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline transition-colors group-focus-within:text-[#006195]">
          lock
        </span>
        <input
          id={id}
          type={show ? "text" : "password"}
          required
          minLength={MIN_PASSWORD_LENGTH}
          autoComplete="new-password"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="••••••••"
          className="w-full rounded-lg border-b-2 border-transparent bg-surface-container-low py-4 pl-12 pr-12 text-on-surface outline-none transition-all placeholder:text-outline-variant focus:border-[#006195] focus:ring-0"
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-outline transition-colors hover:text-on-surface"
        >
          <span className="material-symbols-outlined">
            {show ? "visibility_off" : "visibility"}
          </span>
        </button>
      </div>
    </div>
  );
}

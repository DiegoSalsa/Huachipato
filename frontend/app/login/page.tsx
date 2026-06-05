'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Error en el inicio de sesión');
        return;
      }

      // Guardar token en cookie
      document.cookie = `auth_token=${data.token}; path=/; max-age=86400; SameSite=Lax`;
      if (rememberMe) {
        document.cookie = 'rememberMe=true; path=/; max-age=2592000; SameSite=Lax';
      }

      // Redirigir al dashboard
      router.push('/jugadores');
    } catch (err) {
      setError('Error de conexión');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col md:flex-row overflow-hidden">
      {/* Left Section: Brand Impact (70% width) */}
      <section className="hidden md:flex md:w-[70%] bg-[#006195] relative items-center justify-center overflow-hidden">
        {/* Background Texture for Depth */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 30%, #ffffff 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        {/* Core Brand Elements */}
        <div className="relative z-10 flex flex-col items-center max-w-4xl px-12 text-center">
          <div className="mb-12">
            <img
              alt="Club Deportivo Huachipato Logo"
              className="h-auto w-80 lg:w-96"
              src="https://vectorseek.com/wp-content/uploads/2024/01/Huachipato-FC-Logo-Vector.svg-.png"
            />
          </div>
          <h1 className="font-headline font-extrabold text-5xl text-white tracking-tight mb-4 uppercase">
            Huachipato Analytics
          </h1>
          <p className="font-label text-blue-100 text-lg tracking-wide opacity-80 uppercase">
            Sistema de Análisis Deportivo
          </p>
        </div>
      </section>

      {/* Right Section: Form (30% width) */}
      <section className="w-full md:w-[30%] bg-white flex flex-col justify-center px-8 md:px-12 py-12 relative shadow-[-24px_0_48px_rgba(13,28,46,0.04)] z-20">
        {/* Mobile Logo Only */}
        <div className="md:hidden flex justify-center mb-12">
          <img
            alt="Huachipato Logo"
            className="w-32 h-auto"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuALd99pupk1sqog3lfFwsFomRnP_899txMB1MVQRV3zhSgruSs3VG62B1P1sAeDzSw2pq4M1AE37uZN9zJ3tcEFqdnPM_UPaexfDbTDaHNMcB-Kb-ErvPubC_7TX1ydqbKrDLx4MoSP1J6vM32d1dXEyzhcORhOITTTzpsIEz3syklITB6sKTcIQcyULm51m4FHMnqYsWs_VFxi8af8qcw3hc4CgsdVIGZzSsTWXdZlpUaQUspoxSyY_-U2X1rNLKWtP02FwP_V5sY"
          />
        </div>

        <div className="max-w-sm w-full mx-auto">
          <header className="mb-10">
            <h2 className="font-headline font-bold text-3xl text-on-surface tracking-tight mb-2">
              Iniciar Sesión
            </h2>
            <p className="text-on-surface-variant text-sm font-medium">
              Bienvenido al sistema de analítica oficial.
            </p>
          </header>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Error Message */}
            {error && (
              <div className="p-4 bg-error-container border border-error rounded-lg text-error text-sm">
                {error}
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <label
                className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest"
                htmlFor="email"
              >
                Correo Electrónico
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-[#006195] transition-colors">
                  mail
                </span>
                <input
                  className="w-full pl-12 pr-4 py-4 bg-surface-container-low border-b-2 border-transparent focus:border-[#006195] focus:ring-0 text-on-surface transition-all rounded-lg placeholder:text-outline-variant"
                  id="email"
                  placeholder="usuario@huachipato.cl"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label
                className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest"
                htmlFor="password"
              >
                Contraseña
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-[#006195] transition-colors">
                  lock
                </span>
                <input
                  className="w-full pl-12 pr-12 py-4 bg-surface-container-low border-b-2 border-transparent focus:border-[#006195] focus:ring-0 text-on-surface transition-all rounded-lg placeholder:text-outline-variant"
                  id="password"
                  placeholder="••••••••"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between py-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center">
                  <input
                    className="peer h-5 w-5 rounded-md border-outline-variant bg-surface-container-low text-[#006195] focus:ring-[#006195]/20 transition-all"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                </div>
                <span className="text-sm font-medium text-on-surface-variant group-hover:text-on-surface transition-colors">
                  Recordarme
                </span>
              </label>
              <a
                className="text-sm font-bold text-[#006195] hover:text-primary-container transition-colors"
                href="#"
              >
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            {/* Submit Button */}
            <button
              className="w-full py-4 px-6 bg-[#006195] text-white font-headline font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-container active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              type="submit"
              disabled={loading}
            >
              <span>{loading ? 'Ingresando...' : 'Ingresar'}</span>
              <span className="material-symbols-outlined text-xl">login</span>
            </button>
          </form>

          {/* Footer/Support */}
          <footer className="mt-16 pt-8 border-t border-surface-container-low">
            <p className="text-xs font-medium text-outline text-center">
              Acceso restringido para personal técnico y directivo de <br />
              <span className="text-on-surface-variant font-bold uppercase tracking-tight">
                Club Deportivo Huachipato
              </span>
            </p>
            <div className="flex justify-center gap-6 mt-6">
              <a
                className="text-outline hover:text-[#006195] transition-colors"
                href="#"
              >
                <span className="material-symbols-outlined text-xl">help</span>
              </a>
              <a
                className="text-outline hover:text-[#006195] transition-colors"
                href="#"
              >
                <span className="material-symbols-outlined text-xl">language</span>
              </a>
            </div>
          </footer>
        </div>
      </section>
    </main>
  );
}

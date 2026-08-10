import { useState } from "react";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { brand, Especialidad, UserRole } from "../brand";

export interface AppUser {
  name: string;
  email: string;
  numeroSocio: string;
  role: UserRole;
  direccion: string;
  especialidad?: Especialidad;
}

interface LoginPageProps {
  onLogin: (user: AppUser) => void;
}

type LoginMode = "tutor" | "profesional";

export function LoginPage({ onLogin }: LoginPageProps) {
  const [mode, setMode] = useState<LoginMode>("tutor");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Introduce tu correo y contraseña para continuar.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      if (mode === "tutor") {
        if (email === "maria@ejemplo.com" && password === "1234") {
          onLogin({
            name: "María García López",
            email,
            numeroSocio: "TA-2026-00482",
            role: "tutor",
            direccion: "Carrer de la Pau 12, 08001 Barcelona",
          });
          return;
        }
        setError("Credenciales de familia no reconocidas. Demo: maria@ejemplo.com / 1234");
        setLoading(false);
        return;
      }

      if (email === "laura@terranima.com" && password === "1234") {
        onLogin({
          name: "Laura Vidal",
          email,
          numeroSocio: "",
          role: "profesional",
          direccion: "",
          especialidad: "Educación canina",
        });
        return;
      }
      if (email === "noelia@terranima.com" && password === "1234") {
        onLogin({
          name: "Noelia Serra",
          email,
          numeroSocio: "",
          role: "profesional",
          direccion: "",
          especialidad: "Nutrición",
        });
        return;
      }

      setError("Credenciales de profesional no reconocidas. Demo: laura@terranima.com o noelia@terranima.com / 1234");
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: brand.crema }}>
      <header
        className="px-8 py-5 flex items-center gap-3"
        style={{ borderBottom: `1px solid ${brand.border}` }}
      >
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center font-display text-sm font-semibold"
          style={{ background: brand.mostaza, color: brand.carbon }}
        >
          T
        </div>
        <div>
          <span className="font-display text-lg font-semibold" style={{ color: brand.ciruela }}>
            Terrànima
          </span>
          <span
            className="text-xs ml-3 uppercase tracking-widest hidden sm:inline"
            style={{ color: brand.carbonMuted, letterSpacing: "0.1em" }}
          >
            Cuidado integrativo para familias multiespecie
          </span>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div
            className="rounded-lg overflow-hidden"
            style={{ background: brand.cremaCard, border: `1px solid ${brand.border}`, boxShadow: "0 12px 40px rgba(44,44,42,0.06)" }}
          >
            <div className="px-8 pt-6 pb-4" style={{ borderBottom: `3px solid ${brand.mostaza}` }}>
              <div
                className="flex gap-0 mb-4"
                style={{ background: brand.crema, borderRadius: "0.375rem", padding: "3px" }}
              >
                {([
                  { id: "tutor" as const, label: "Familias" },
                  { id: "profesional" as const, label: "Profesionales" },
                ]).map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => { setMode(t.id); setError(""); }}
                    className="flex-1 py-2 text-sm font-medium rounded transition-all"
                    style={{
                      background: mode === t.id ? brand.mostaza : "transparent",
                      color: mode === t.id ? brand.carbon : brand.carbonMuted,
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <p
                className="text-xs uppercase tracking-widest mb-2"
                style={{ color: brand.carbonMuted, letterSpacing: "0.12em" }}
              >
                {mode === "tutor" ? "Área de familias" : "Área de profesionales"}
              </p>
              <h1 className="font-display text-2xl font-semibold" style={{ color: brand.ciruela }}>
                Bienvenida
              </h1>
              <p className="text-sm mt-1" style={{ color: brand.carbonMuted }}>
                {mode === "tutor"
                  ? "Accede para acompañar el cuidado de tu familia multiespecie"
                  : "Gestiona citas y chats con las familias"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="px-8 py-8 space-y-5">
              {error && (
                <div
                  className="flex items-start gap-2 p-3 rounded text-sm"
                  style={{ background: brand.dangerSoft, border: `1px solid ${brand.danger}33`, color: brand.danger }}
                >
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium" style={{ color: brand.carbon }}>
                  Correo electrónico
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="nombre@ejemplo.com"
                  className="w-full px-3 py-2.5 rounded text-sm outline-none transition-all"
                  style={{
                    background: brand.crema,
                    border: `1px solid ${brand.borderStrong}`,
                    color: brand.carbon,
                  }}
                  onFocus={e => e.target.style.border = `1px solid ${brand.mostaza}`}
                  onBlur={e => e.target.style.border = `1px solid ${brand.borderStrong}`}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-medium" style={{ color: brand.carbon }}>
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2.5 pr-10 rounded text-sm outline-none transition-all"
                    style={{
                      background: brand.crema,
                      border: `1px solid ${brand.borderStrong}`,
                      color: brand.carbon,
                    }}
                    onFocus={e => e.target.style.border = `1px solid ${brand.mostaza}`}
                    onBlur={e => e.target.style.border = `1px solid ${brand.borderStrong}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-100 opacity-50"
                    style={{ color: brand.carbonMuted }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded text-sm font-semibold tracking-wide transition-all disabled:opacity-70"
                style={{ background: brand.mostaza, color: brand.carbon }}
                onMouseEnter={e => { if (!loading) (e.target as HTMLElement).style.background = brand.mostazaHover; }}
                onMouseLeave={e => { if (!loading) (e.target as HTMLElement).style.background = brand.mostaza; }}
              >
                {loading ? "Entrando…" : "Entrar"}
              </button>
            </form>
          </div>

          <p className="text-center text-xs mt-6 space-y-1" style={{ color: brand.carbonFaint }}>
            {mode === "tutor" ? (
              <span>Demo familia: maria@ejemplo.com / 1234</span>
            ) : (
              <>
                <span className="block">Educación canina: laura@terranima.com / 1234</span>
                <span className="block">Nutrición: noelia@terranima.com / 1234</span>
              </>
            )}
          </p>
        </div>
      </div>

      <footer className="text-center pb-6 text-xs" style={{ color: brand.azulNoche }}>
        © 2026 Terrànima · Cooperativa de bienestar animal integrativo
      </footer>
    </div>
  );
}

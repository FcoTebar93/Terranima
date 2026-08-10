import { useState } from "react";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import {
  brand,
  Especialidad,
  TipoUsuario,
  TIPO_USUARIO,
  TIPO_PROFESIONAL,
  roleFromTipo,
  UserRole,
} from "../brand";

/** Usuario de sesión; `tipo` discrimina la vista (1 usuario, 2 profesional). */
export interface AppUser {
  name: string;
  email: string;
  /** 1 = usuario/familia · 2 = profesional */
  tipo: TipoUsuario;
  /** Derivado de `tipo` para la UI existente */
  role: UserRole;
  numeroSocio: string;
  direccion: string;
  especialidad?: Especialidad;
}

interface CuentaDemo {
  email: string;
  password: string;
  name: string;
  tipo: TipoUsuario;
  numeroSocio: string;
  direccion: string;
  especialidad?: Especialidad;
}

/** Simula lo que devolvería la API al autenticar. */
const cuentasDemo: CuentaDemo[] = [
  {
    email: "maria@ejemplo.com",
    password: "1234",
    name: "María García López",
    tipo: TIPO_USUARIO,
    numeroSocio: "TA-2026-00482",
    direccion: "Carrer de la Pau 12, 08001 Barcelona",
  },
  {
    email: "laura@terranima.com",
    password: "1234",
    name: "Laura Vidal",
    tipo: TIPO_PROFESIONAL,
    numeroSocio: "",
    direccion: "",
    especialidad: "Educación canina",
  },
  {
    email: "noelia@terranima.com",
    password: "1234",
    name: "Noelia Serra",
    tipo: TIPO_PROFESIONAL,
    numeroSocio: "",
    direccion: "",
    especialidad: "Nutrición",
  },
];

interface LoginPageProps {
  onLogin: (user: AppUser) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
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
      const cuenta = cuentasDemo.find(
        c => c.email.toLowerCase() === email.trim().toLowerCase() && c.password === password
      );

      if (!cuenta) {
        setError("No hemos podido reconocer esas credenciales.");
        setLoading(false);
        return;
      }

      onLogin({
        name: cuenta.name,
        email: cuenta.email,
        tipo: cuenta.tipo,
        role: roleFromTipo(cuenta.tipo),
        numeroSocio: cuenta.numeroSocio,
        direccion: cuenta.direccion,
        especialidad: cuenta.especialidad,
      });
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
            <div className="px-8 py-6" style={{ borderBottom: `3px solid ${brand.mostaza}` }}>
              <p
                className="text-xs uppercase tracking-widest mb-2"
                style={{ color: brand.carbonMuted, letterSpacing: "0.12em" }}
              >
                Acceso
              </p>
              <h1 className="font-display text-2xl font-semibold" style={{ color: brand.ciruela }}>
                Bienvenida
              </h1>
              <p className="text-sm mt-1" style={{ color: brand.carbonMuted }}>
                Entra con tu cuenta de Terrànima
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

              <div className="flex justify-end">
                <button type="button" className="text-xs transition-colors" style={{ color: brand.ciruela }}>
                  ¿Olvidaste tu contraseña?
                </button>
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

          <div className="text-center text-xs mt-6 space-y-1" style={{ color: brand.carbonFaint }}>
            <p>Demo usuario (tipo 1): maria@ejemplo.com / 1234</p>
            <p>Demo profesional (tipo 2): laura@terranima.com / 1234</p>
            <p>Demo profesional (tipo 2): noelia@terranima.com / 1234</p>
          </div>
        </div>
      </div>

      <footer className="text-center pb-6 text-xs" style={{ color: brand.azulNoche }}>
        © 2026 Terrànima · Cooperativa de bienestar animal integrativo
      </footer>
    </div>
  );
}

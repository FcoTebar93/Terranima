import {
  Home, CalendarDays, FileText, MessageSquare, Heart, LogOut, ChevronRight,
} from "lucide-react";
import { brand } from "../brand";

export type Section = "dashboard" | "perfil" | "citas" | "informes" | "chat";

interface MainLayoutProps {
  user: { name: string; email: string };
  activeSection: Section;
  onNavigate: (section: Section) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

const navItems: {
  id: Section;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  badge?: number;
}[] = [
  { id: "dashboard", label: "Inicio", shortLabel: "Inicio", icon: <Home size={22} strokeWidth={1.75} /> },
  { id: "perfil", label: "Mis animales", shortLabel: "Animales", icon: <Heart size={22} strokeWidth={1.75} /> },
  { id: "citas", label: "Citas", shortLabel: "Citas", icon: <CalendarDays size={22} strokeWidth={1.75} />, badge: 1 },
  { id: "informes", label: "Documentos", shortLabel: "Docs", icon: <FileText size={22} strokeWidth={1.75} /> },
  { id: "chat", label: "Conversaciones", shortLabel: "Chat", icon: <MessageSquare size={22} strokeWidth={1.75} />, badge: 2 },
];

export function MainLayout({ user, activeSection, onNavigate, onLogout, children }: MainLayoutProps) {
  const initials = user.name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
  const activeLabel = navItems.find(n => n.id === activeSection)?.label;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: brand.crema }}>
      {/* Sidebar — solo escritorio */}
      <aside
        className="w-56 flex-shrink-0 hidden md:flex flex-col h-full"
        style={{ background: brand.cremaCard, borderRight: `1px solid ${brand.border}` }}
      >
        <div className="px-5 py-5" style={{ borderBottom: `1px solid ${brand.border}` }}>
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-display text-sm font-semibold"
              style={{ background: brand.mostaza, color: brand.carbon }}
            >
              T
            </div>
            <div>
              <div className="font-display text-sm font-semibold tracking-tight" style={{ color: brand.ciruela }}>
                Terrànima
              </div>
              <div
                className="text-xs uppercase tracking-widest"
                style={{ color: brand.carbonMuted, letterSpacing: "0.08em" }}
              >
                Área de familias
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p
            className="text-xs uppercase tracking-widest px-2 pb-2"
            style={{ color: brand.carbonFaint, letterSpacing: "0.1em" }}
          >
            Menú
          </p>
          {navItems.map(item => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-all relative"
                style={{
                  background: isActive ? brand.ciruelaSoft : "transparent",
                  color: isActive ? brand.ciruela : brand.carbonMuted,
                  borderLeft: isActive ? `3px solid ${brand.mostaza}` : "3px solid transparent",
                }}
                onMouseEnter={e => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.background = brand.mostazaSoft;
                }}
                onMouseLeave={e => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                <span className="font-medium flex-1 text-left">{item.label}</span>
                {item.badge ? (
                  <span
                    className="w-5 h-5 rounded-full text-xs flex items-center justify-center font-semibold flex-shrink-0"
                    style={{ background: brand.mostaza, color: brand.carbon }}
                  >
                    {item.badge}
                  </span>
                ) : null}
                {isActive && <ChevronRight size={14} className="flex-shrink-0" style={{ color: brand.ciruela }} />}
              </button>
            );
          })}
        </nav>

        <div className="px-3 py-4" style={{ borderTop: `1px solid ${brand.border}` }}>
          <div className="flex items-center gap-3 px-2 mb-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold"
              style={{ background: brand.ciruela, color: brand.crema }}
            >
              {initials}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-medium truncate" style={{ color: brand.carbon }}>
                {user.name.split(" ").slice(0, 2).join(" ")}
              </div>
              <div className="text-xs truncate" style={{ color: brand.carbonMuted }}>{user.email}</div>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded text-sm transition-all"
            style={{ color: brand.carbonMuted }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = brand.mostazaSoft;
              (e.currentTarget as HTMLElement).style.color = brand.carbon;
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
              (e.currentTarget as HTMLElement).style.color = brand.carbonMuted;
            }}
          >
            <LogOut size={15} />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Cabecera — solo escritorio */}
        <header
          className="hidden md:flex flex-shrink-0 items-center gap-4 px-6 py-3.5"
          style={{ background: brand.cremaCard, borderBottom: `1px solid ${brand.border}` }}
        >
          <div className="flex-1">
            <h2 className="font-display text-base font-semibold" style={{ color: brand.ciruela }}>
              {activeLabel}
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs" style={{ color: brand.carbonMuted }}>
            <span>{user.name.split(" ").slice(0, 2).join(" ")}</span>
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold"
              style={{ background: brand.mostaza, color: brand.carbon }}
            >
              {initials}
            </div>
          </div>
        </header>

        {/* Contenido: padding inferior en móvil para no tapar con la tab bar */}
        <main className="flex-1 overflow-y-auto px-4 pt-4 pb-[calc(4.75rem+env(safe-area-inset-bottom))] md:p-6">
          {children}
        </main>
      </div>

      {/* Tab bar inferior fija — solo móvil (estilo app salud) */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40"
        style={{
          background: brand.cremaCard,
          borderTop: `1px solid ${brand.border}`,
          paddingBottom: "env(safe-area-inset-bottom)",
          boxShadow: "0 -4px 20px rgba(44, 44, 42, 0.06)",
        }}
        aria-label="Navegación principal"
      >
        <div className="flex items-stretch justify-between h-[3.75rem] max-w-lg mx-auto px-1">
          {navItems.map(item => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className="relative flex-1 flex flex-col items-center justify-center gap-0.5 min-w-0 transition-colors"
                style={{ color: isActive ? brand.ciruela : brand.carbonMuted }}
                aria-current={isActive ? "page" : undefined}
              >
                {isActive && (
                  <span
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                    style={{ background: brand.mostaza }}
                  />
                )}
                <span className="relative">
                  {item.icon}
                  {item.badge ? (
                    <span
                      className="absolute -top-1.5 -right-2.5 min-w-[1rem] h-4 px-0.5 rounded-full text-[10px] flex items-center justify-center font-semibold"
                      style={{ background: brand.mostaza, color: brand.carbon }}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </span>
                <span
                  className="text-[10px] leading-tight truncate max-w-full px-0.5"
                  style={{ fontWeight: isActive ? 600 : 500 }}
                >
                  {item.shortLabel}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

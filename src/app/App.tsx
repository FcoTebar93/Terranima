import { useEffect, useMemo, useState } from "react";
import { LoginPage, AppUser } from "./components/LoginPage";
import { MainLayout, Section } from "./components/MainLayout";
import { DashboardPage } from "./components/DashboardPage";
import { PerfilPage } from "./components/PerfilPage";
import { CitasPage } from "./components/CitasPage";
import { InformesPage } from "./components/InformesPage";
import { ChatPage } from "./components/ChatPage";
import { ProfCitasPage } from "./components/ProfCitasPage";
import { ProfChatPage } from "./components/ProfChatPage";
import { Especialidad, isProfesionalTipo, TIPO_PROFESIONAL, brand } from "./brand";
import { citasDemoIniciales } from "./demoData";
import { fetchMe, logout, TerranimaApiError, isAccessDeniedError } from "./api/terranima";
import { isWpEmbedded } from "./wpConfig";

function AccessDenied({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: brand.crema }}>
      <div
        className="max-w-md w-full rounded-lg p-8 text-center"
        style={{ background: brand.cremaCard, border: `1px solid ${brand.border}` }}
      >
        <h1 className="font-display text-xl font-semibold" style={{ color: brand.ciruela }}>
          Sin acceso
        </h1>
        <p className="text-sm mt-3" style={{ color: brand.carbonMuted }}>
          {message}
        </p>
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: brand.crema }}>
      <p className="text-sm" style={{ color: brand.carbonMuted }}>
        Cargando…
      </p>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [section, setSection] = useState<Section>("dashboard");
  const [booting, setBooting] = useState(isWpEmbedded());
  const [accessDenied, setAccessDenied] = useState<string | null>(null);

  useEffect(() => {
    if (!isWpEmbedded()) {
      setBooting(false);
      return;
    }

    let cancelled = false;

    fetchMe()
      .then(u => {
        if (cancelled) return;
        setUser(u);
        setSection(u.tipo === TIPO_PROFESIONAL ? "citas" : "dashboard");
      })
      .catch(err => {
        if (cancelled) return;
        if (err instanceof TerranimaApiError && isAccessDeniedError(err)) {
          setAccessDenied(err.message);
        }
        // 401 / nonce inválido → mostrar login (no bloquear con mensaje de cookies).
      })
      .finally(() => {
        if (!cancelled) setBooting(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const [pendingCount, setPendingCount] = useState(0);

  const pendingForProf = useMemo(() => {
    if (!user || !isProfesionalTipo(user.tipo) || !user.especialidad) return 0;
    if (isWpEmbedded()) return pendingCount;
    return citasDemoIniciales.filter(
      c => c.profesional === user.especialidad && c.estado === "pendiente"
    ).length;
  }, [user, pendingCount]);

  if (booting) {
    return <LoadingScreen />;
  }

  if (accessDenied) {
    return <AccessDenied message={accessDenied} />;
  }

  if (!user) {
    return (
      <LoginPage
        onLogin={u => {
          setUser(u);
          setSection(u.tipo === TIPO_PROFESIONAL ? "citas" : "dashboard");
        }}
      />
    );
  }

  const isProf = isProfesionalTipo(user.tipo);
  const especialidad = (user.especialidad ?? "Educación canina") as Especialidad;

  const handleLogout = async () => {
    if (isWpEmbedded()) {
      try {
        await logout();
      } catch {
        // Si falla el endpoint, limpiamos la UI igualmente.
      }
    }
    setUser(null);
    setSection("dashboard");
    setAccessDenied(null);
  };

  return (
    <MainLayout
      user={user}
      activeSection={section}
      onNavigate={setSection}
      onLogout={handleLogout}
      pendingCitas={isProf ? pendingForProf : 0}
      unreadChats={isProf ? 1 : 2}
    >
      {!isProf && section === "dashboard" && (
        <DashboardPage
          onNavigate={s => setSection(s)}
          userName={user.name}
          numeroSocio={user.numeroSocio}
        />
      )}
      {!isProf && section === "perfil" && <PerfilPage role={user.role} />}
      {!isProf && section === "citas" && <CitasPage />}
      {!isProf && section === "informes" && <InformesPage />}
      {!isProf && section === "chat" && <ChatPage />}

      {isProf && section === "citas" && (
        <ProfCitasPage
          especialidad={especialidad}
          profesionalNombre={user.name}
          onPendingCountChange={setPendingCount}
        />
      )}
      {isProf && section === "chat" && (
        <ProfChatPage
          especialidad={especialidad}
          profesionalNombre={user.name}
        />
      )}
    </MainLayout>
  );
}

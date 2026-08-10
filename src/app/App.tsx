import { useMemo, useState } from "react";
import { LoginPage, AppUser } from "./components/LoginPage";
import { MainLayout, Section } from "./components/MainLayout";
import { DashboardPage } from "./components/DashboardPage";
import { PerfilPage } from "./components/PerfilPage";
import { CitasPage } from "./components/CitasPage";
import { InformesPage } from "./components/InformesPage";
import { ChatPage } from "./components/ChatPage";
import { ProfCitasPage } from "./components/ProfCitasPage";
import { ProfChatPage } from "./components/ProfChatPage";
import { Especialidad, isProfesionalTipo, TIPO_PROFESIONAL } from "./brand";
import { citasDemoIniciales } from "./demoData";

export default function App() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [section, setSection] = useState<Section>("dashboard");

  const pendingForProf = useMemo(() => {
    if (!user || !isProfesionalTipo(user.tipo) || !user.especialidad) return 0;
    return citasDemoIniciales.filter(
      c => c.profesional === user.especialidad && c.estado === "pendiente"
    ).length;
  }, [user]);

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

  return (
    <MainLayout
      user={user}
      activeSection={section}
      onNavigate={setSection}
      onLogout={() => {
        setUser(null);
        setSection("dashboard");
      }}
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

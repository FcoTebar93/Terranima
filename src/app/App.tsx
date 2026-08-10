import { useState } from "react";
import { LoginPage } from "./components/LoginPage";
import { MainLayout, Section } from "./components/MainLayout";
import { DashboardPage } from "./components/DashboardPage";
import { PerfilPage } from "./components/PerfilPage";
import { CitasPage } from "./components/CitasPage";
import { InformesPage } from "./components/InformesPage";
import { ChatPage } from "./components/ChatPage";
import { UserRole } from "./brand";

interface User {
  name: string;
  email: string;
  /** Número de socio generado al crear la ficha de cliente */
  numeroSocio: string;
  role: UserRole;
  /** Dirección del domicilio (visible en ficha para profesionales) */
  direccion: string;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [section, setSection] = useState<Section>("dashboard");

  if (!user) {
    return <LoginPage onLogin={setUser} />;
  }

  const handleNavigate = (s: Section) => setSection(s);

  return (
    <MainLayout
      user={user}
      activeSection={section}
      onNavigate={handleNavigate}
      onLogout={() => { setUser(null); setSection("dashboard"); }}
    >
      {section === "dashboard" && (
        <DashboardPage
          onNavigate={(s) => setSection(s)}
          userName={user.name}
          numeroSocio={user.numeroSocio}
        />
      )}
      {section === "perfil" && <PerfilPage role={user.role} />}
      {section === "citas" && <CitasPage />}
      {section === "informes" && <InformesPage />}
      {section === "chat" && <ChatPage />}
    </MainLayout>
  );
}

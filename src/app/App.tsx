import { useState } from "react";
import { LoginPage } from "./components/LoginPage";
import { MainLayout, Section } from "./components/MainLayout";
import { DashboardPage } from "./components/DashboardPage";
import { PerfilPage } from "./components/PerfilPage";
import { CitasPage } from "./components/CitasPage";
import { InformesPage } from "./components/InformesPage";
import { ChatPage } from "./components/ChatPage";

interface User {
  name: string;
  email: string;
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
        <DashboardPage onNavigate={(s) => setSection(s)} />
      )}
      {section === "perfil" && <PerfilPage />}
      {section === "citas" && <CitasPage />}
      {section === "informes" && <InformesPage />}
      {section === "chat" && <ChatPage />}
    </MainLayout>
  );
}

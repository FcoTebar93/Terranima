import { useState } from "react";
import { CalendarDays, Clock, ChevronDown, FileCheck, User, ChevronRight } from "lucide-react";
import { brand } from "../brand";

interface Animal {
  id: string;
  nombre: string;
  especie: "perro" | "gato" | "conejo" | "ave";
  raza: string;
  edad: string;
  color: string;
  inicial: string;
}

const animales: Animal[] = [
  { id: "1", nombre: "Luna", especie: "gato", raza: "Europea común", edad: "4 años", color: brand.ciruela, inicial: "L" },
  { id: "2", nombre: "Rocky", especie: "perro", raza: "Labrador Retriever", edad: "2 años", color: brand.mostaza, inicial: "R" },
];

interface DashboardPageProps {
  onNavigate: (section: "citas" | "informes" | "chat") => void;
}

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const [selectedAnimal, setSelectedAnimal] = useState(animales[0]);
  const [selectorOpen, setSelectorOpen] = useState(false);

  const contratoInicio = new Date("2026-01-01");
  const contratoFin = new Date("2026-12-31");
  const hoy = new Date("2026-07-27");
  const totalDias = Math.round((contratoFin.getTime() - contratoInicio.getTime()) / (1000 * 60 * 60 * 24));
  const diasPasados = Math.round((hoy.getTime() - contratoInicio.getTime()) / (1000 * 60 * 60 * 24));
  const progreso = Math.min(100, Math.round((diasPasados / totalDias) * 100));
  const mesesRestantes = Math.ceil((contratoFin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24 * 30));

  const proximaCita = {
    fecha: "22 de agosto de 2026",
    hora: "11:00",
    tipo: "Sesión de educación",
    profesional: "Educador/a canino y felino",
    animal: "Rocky",
    dias: 26,
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold" style={{ color: brand.ciruela }}>
          Hola, María
        </h1>
        <p className="text-sm mt-1" style={{ color: brand.carbonMuted }}>
          Lunes, 27 de julio de 2026 · Tu equipo te acompaña
        </p>
      </div>

      <div
        className="rounded-lg p-5"
        style={{ background: brand.cremaCard, border: `1px solid ${brand.border}` }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 font-display"
              style={{ background: selectedAnimal.color + "22", color: selectedAnimal.color }}
            >
              {selectedAnimal.inicial}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-base font-semibold" style={{ color: brand.ciruela }}>
                  {selectedAnimal.nombre}
                </h2>
                <span
                  className="text-xs px-2 py-0.5 rounded uppercase tracking-wider"
                  style={{ background: selectedAnimal.color + "18", color: selectedAnimal.color, letterSpacing: "0.06em" }}
                >
                  {selectedAnimal.especie}
                </span>
              </div>
              <p className="text-xs mt-0.5" style={{ color: brand.carbonMuted }}>
                {selectedAnimal.raza} · {selectedAnimal.edad}
              </p>
            </div>
          </div>

          {animales.length > 1 && (
            <div className="relative">
              <button
                onClick={() => setSelectorOpen(!selectorOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all"
                style={{ background: brand.mostazaSoft, color: brand.carbon, border: `1px solid ${brand.mostaza}55` }}
              >
                Cambiar animal
                <ChevronDown size={13} className={`transition-transform ${selectorOpen ? "rotate-180" : ""}`} />
              </button>
              {selectorOpen && (
                <div
                  className="absolute right-0 top-full mt-1.5 w-48 rounded-lg shadow-lg z-10 overflow-hidden"
                  style={{ background: brand.cremaCard, border: `1px solid ${brand.border}` }}
                >
                  {animales.map(a => (
                    <button
                      key={a.id}
                      onClick={() => { setSelectedAnimal(a); setSelectorOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-all text-left"
                      style={{
                        background: selectedAnimal.id === a.id ? brand.ciruelaSoft : "transparent",
                        color: brand.carbon,
                      }}
                      onMouseEnter={e => { if (selectedAnimal.id !== a.id) (e.currentTarget as HTMLElement).style.background = brand.crema; }}
                      onMouseLeave={e => { if (selectedAnimal.id !== a.id) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                    >
                      <span
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold font-display"
                        style={{ background: a.color + "22", color: a.color }}
                      >
                        {a.inicial}
                      </span>
                      <div>
                        <div className="font-medium text-xs">{a.nombre}</div>
                        <div className="text-xs" style={{ color: brand.carbonMuted }}>{a.raza}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          className="rounded-lg overflow-hidden"
          style={{ background: brand.cremaCard, border: `1px solid ${brand.border}` }}
        >
          <div
            className="px-5 py-3 flex items-center justify-between"
            style={{ borderBottom: `1px solid ${brand.border}` }}
          >
            <div className="flex items-center gap-2">
              <CalendarDays size={15} style={{ color: brand.ciruela }} />
              <span
                className="text-xs font-medium uppercase tracking-widest"
                style={{ color: brand.ciruela, letterSpacing: "0.1em" }}
              >
                Próxima cita
              </span>
            </div>
            <span
              className="text-xs px-2 py-0.5 rounded font-medium"
              style={{ background: brand.mostazaSoft, color: brand.carbon }}
            >
              En {proximaCita.dias} días
            </span>
          </div>
          <div className="p-5 space-y-3">
            <div>
              <p className="font-display text-base font-semibold" style={{ color: brand.ciruela }}>
                {proximaCita.tipo}
              </p>
              <p className="text-xs mt-0.5" style={{ color: brand.carbonMuted }}>
                Con {proximaCita.animal}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm" style={{ color: brand.carbon }}>
                <CalendarDays size={14} style={{ color: brand.mostaza }} />
                <span>{proximaCita.fecha}</span>
              </div>
              <div className="flex items-center gap-2 text-sm" style={{ color: brand.carbon }}>
                <Clock size={14} style={{ color: brand.mostaza }} />
                <span>{proximaCita.hora} h</span>
              </div>
              <div className="flex items-center gap-2 text-sm" style={{ color: brand.carbon }}>
                <User size={14} style={{ color: brand.mostaza }} />
                <span>{proximaCita.profesional}</span>
              </div>
            </div>
            <button
              onClick={() => onNavigate("citas")}
              className="w-full mt-1 py-2 rounded text-xs font-medium transition-all flex items-center justify-center gap-1"
              style={{ background: brand.mostazaSoft, color: brand.carbon }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = brand.mostaza}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = brand.mostazaSoft}
            >
              Ver todas las citas <ChevronRight size={12} />
            </button>
          </div>
        </div>

        <div
          className="rounded-lg overflow-hidden"
          style={{ background: brand.cremaCard, border: `1px solid ${brand.border}` }}
        >
          <div
            className="px-5 py-3 flex items-center gap-2"
            style={{ borderBottom: `1px solid ${brand.border}` }}
          >
            <FileCheck size={15} style={{ color: brand.ciruela }} />
            <span
              className="text-xs font-medium uppercase tracking-widest"
              style={{ color: brand.ciruela, letterSpacing: "0.1em" }}
            >
              Acompañamiento activo
            </span>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-display text-base font-semibold" style={{ color: brand.ciruela }}>
                  Plan familiar anual
                </p>
                <p className="text-xs mt-0.5" style={{ color: brand.carbonMuted }}>
                  Vigente hasta dic. 2026
                </p>
              </div>
              <span
                className="text-xs px-2 py-0.5 rounded font-medium"
                style={{ background: brand.successSoft, color: brand.success }}
              >
                Activo
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs" style={{ color: brand.carbonMuted }}>Tiempo transcurrido</span>
                <span className="text-xs font-semibold" style={{ color: brand.azulNoche }}>{progreso}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: brand.crema }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${progreso}%`, background: brand.mostaza }}
                />
              </div>
              <p className="text-xs mt-1.5" style={{ color: brand.carbonMuted }}>
                Quedan <strong style={{ color: brand.carbon }}>{mesesRestantes} meses</strong> · Hasta 31/12/2026
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="rounded p-3 text-center" style={{ background: brand.crema }}>
                <p className="text-xs" style={{ color: brand.carbonMuted }}>Inicio</p>
                <p className="text-sm font-semibold mt-0.5" style={{ color: brand.azulNoche }}>01/01/2026</p>
              </div>
              <div className="rounded p-3 text-center" style={{ background: brand.crema }}>
                <p className="text-xs" style={{ color: brand.carbonMuted }}>Fin</p>
                <p className="text-sm font-semibold mt-0.5" style={{ color: brand.azulNoche }}>31/12/2026</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

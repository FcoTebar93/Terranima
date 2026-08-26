import { useEffect, useState } from "react";
import { CalendarDays, Clock, ChevronDown, FileCheck, User, ChevronRight, Users } from "lucide-react";
import { brand } from "../brand";
import { fetchCitas, type ApiCita } from "../api/terranima";
import { isWpEmbedded } from "../wpConfig";
import { citasDemoIniciales } from "../demoData";

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

interface Acompanamiento {
  id: string;
  titulo: string;
  subtitulo: string;
  estado: "activo";
  tipo: "plan" | "bono";
  /** Plan: progreso temporal; Bono: sesiones usadas/total */
  progresoLabel: string;
  progresoPct: number;
  detalle: string;
  metaIzq?: { label: string; valor: string };
  metaDer?: { label: string; valor: string };
}

const acompanamientos: Acompanamiento[] = [
  {
    id: "plan",
    titulo: "Plan familiar anual",
    subtitulo: "Vigente hasta dic. 2026",
    estado: "activo",
    tipo: "plan",
    progresoLabel: "Tiempo transcurrido",
    progresoPct: 57,
    detalle: "Quedan 5 meses · Hasta 31/12/2026",
    metaIzq: { label: "Inicio", valor: "01/01/2026" },
    metaDer: { label: "Fin", valor: "31/12/2026" },
  },
  {
    id: "bono",
    titulo: "Bono grupos de desarrollo",
    subtitulo: "Sesiones grupales con el equipo",
    estado: "activo",
    tipo: "bono",
    progresoLabel: "Sesiones usadas",
    progresoPct: 25,
    detalle: "Has usado 2 de 8 sesiones",
    metaIzq: { label: "Usadas", valor: "2" },
    metaDer: { label: "Disponibles", valor: "6" },
  },
];

interface CitaResumen {
  fecha: string;
  hora: string;
  tipo: string;
  profesional: string;
  animal: string;
}

function hoyIso() {
  return new Date().toISOString().slice(0, 10);
}

function esCitaProxima(c: { fecha: string; estado: string }) {
  return c.fecha >= hoyIso() && c.estado !== "cancelada" && c.estado !== "completada" && c.estado !== "rechazada";
}

function pickProxima(list: Array<{ fecha: string; hora: string; tipo: string; profesional: string; animal: string; estado: string }>): CitaResumen | null {
  const next = [...list]
    .filter(esCitaProxima)
    .sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora))[0];
  if (!next) return null;
  return {
    fecha: next.fecha,
    hora: next.hora,
    tipo: next.tipo,
    profesional: String(next.profesional),
    animal: next.animal,
  };
}

function formatFechaCita(dateStr: string) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function diasHasta(dateStr: string) {
  const hoy = new Date(hoyIso() + "T12:00:00");
  const cita = new Date(dateStr + "T12:00:00");
  return Math.round((cita.getTime() - hoy.getTime()) / 86400000);
}

function etiquetaDias(dias: number) {
  if (dias <= 0) return "Hoy";
  if (dias === 1) return "Mañana";
  return `En ${dias} días`;
}

interface DashboardPageProps {
  onNavigate: (section: "citas" | "informes" | "chat") => void;
  userName: string;
  numeroSocio?: string;
}

export function DashboardPage({ onNavigate, userName }: DashboardPageProps) {
  const wpMode = isWpEmbedded();
  const [selectedAnimal, setSelectedAnimal] = useState(animales[0]);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [proximaCita, setProximaCita] = useState<CitaResumen | null>(() =>
    wpMode ? null : pickProxima(citasDemoIniciales.filter(c => c.familia === "Familia García López"))
  );

  useEffect(() => {
    if (!wpMode) return;
    let cancelled = false;
    fetchCitas()
      .then((list: ApiCita[]) => {
        if (!cancelled) setProximaCita(pickProxima(list));
      })
      .catch(() => {
        if (!cancelled) setProximaCita(pickProxima(citasDemoIniciales.filter(c => c.familia === "Familia García López")));
      });
    return () => {
      cancelled = true;
    };
  }, [wpMode]);

  const primerNombre = userName.split(" ")[0] || "hola";
  const fechaHoy = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold" style={{ color: brand.ciruela }}>
            Hola, {primerNombre}
          </h1>
          <p className="text-sm mt-1 capitalize" style={{ color: brand.carbonMuted }}>
            {fechaHoy} · Tu equipo te acompaña
          </p>
        </div>
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
              {proximaCita ? etiquetaDias(diasHasta(proximaCita.fecha)) : "—"}
            </span>
          </div>
          {proximaCita ? (
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
                <span className="capitalize">{formatFechaCita(proximaCita.fecha)}</span>
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
          ) : (
          <div className="p-5 space-y-3">
            <p className="text-sm" style={{ color: brand.carbonMuted }}>
              No hay citas próximas.
            </p>
            <button
              onClick={() => onNavigate("citas")}
              className="w-full py-2 rounded text-xs font-medium transition-all flex items-center justify-center gap-1"
              style={{ background: brand.mostazaSoft, color: brand.carbon }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = brand.mostaza}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = brand.mostazaSoft}
            >
              Pedir cita <ChevronRight size={12} />
            </button>
          </div>
          )}
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
          <div className="p-4 space-y-3">
            {acompanamientos.map(item => (
              <div
                key={item.id}
                className="rounded-lg p-4 space-y-3"
                style={{ background: brand.crema, border: `1px solid ${brand.border}` }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {item.tipo === "bono" && (
                        <Users size={14} className="flex-shrink-0" style={{ color: brand.ciruela }} />
                      )}
                      <p className="font-display text-sm font-semibold" style={{ color: brand.ciruela }}>
                        {item.titulo}
                      </p>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: brand.carbonMuted }}>
                      {item.subtitulo}
                    </p>
                  </div>
                  <span
                    className="text-xs px-2 py-0.5 rounded font-medium flex-shrink-0"
                    style={{ background: brand.successSoft, color: brand.success }}
                  >
                    Activo
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs" style={{ color: brand.carbonMuted }}>{item.progresoLabel}</span>
                    <span className="text-xs font-semibold" style={{ color: brand.azulNoche }}>
                      {item.tipo === "bono" ? "2 / 8" : `${item.progresoPct}%`}
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: brand.cremaCard }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${item.progresoPct}%`, background: brand.mostaza }}
                    />
                  </div>
                  <p className="text-xs mt-1.5" style={{ color: brand.carbonMuted }}>
                    {item.detalle}
                  </p>
                </div>

                {item.metaIzq && item.metaDer && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded p-2.5 text-center" style={{ background: brand.cremaCard }}>
                      <p className="text-xs" style={{ color: brand.carbonMuted }}>{item.metaIzq.label}</p>
                      <p className="text-sm font-semibold mt-0.5" style={{ color: brand.azulNoche }}>{item.metaIzq.valor}</p>
                    </div>
                    <div className="rounded p-2.5 text-center" style={{ background: brand.cremaCard }}>
                      <p className="text-xs" style={{ color: brand.carbonMuted }}>{item.metaDer.label}</p>
                      <p className="text-sm font-semibold mt-0.5" style={{ color: brand.azulNoche }}>{item.metaDer.valor}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

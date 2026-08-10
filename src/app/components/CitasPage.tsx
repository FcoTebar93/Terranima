import { useState } from "react";
import { CalendarDays, Plus, ChevronDown, Check } from "lucide-react";
import { brand, especialidades, profesionalPorEspecialidad, Especialidad } from "../brand";

interface Cita {
  id: string;
  fecha: string;
  hora: string;
  tipo: string;
  profesional: string;
  animal: string;
  estado: "confirmada" | "pendiente" | "completada" | "cancelada";
  notas?: string;
  /** Solo el profesional puede crearlas; el tutor las ve pero no las solicita */
  soloProfesional?: boolean;
}

const citasData: Cita[] = [
  { id: "1", fecha: "2026-08-22", hora: "11:00", tipo: "Educación canina", profesional: "Educación canina", animal: "Rocky", estado: "confirmada" },
  { id: "2", fecha: "2026-09-03", hora: "16:30", tipo: "Nutrición", profesional: "Nutrición", animal: "Luna", estado: "pendiente" },
  {
    id: "5",
    fecha: "2026-08-28",
    hora: "18:00",
    tipo: "Grupo de desarrollo",
    profesional: "Educación canina",
    animal: "Rocky",
    estado: "confirmada",
    soloProfesional: true,
    notas: "Sesión 3 del bono de grupos de desarrollo.",
  },
  {
    id: "6",
    fecha: "2026-09-05",
    hora: "17:30",
    tipo: "Dog café",
    profesional: "Terapia familiar",
    animal: "Familia",
    estado: "confirmada",
    soloProfesional: true,
    notas: "Sesión de terapia grupal Dog café.",
  },
  { id: "3", fecha: "2026-07-10", hora: "09:00", tipo: "Nutrición", profesional: "Nutrición", animal: "Rocky", estado: "completada", notas: "Ajuste de ración y transición a dieta blanda durante 5 días." },
  { id: "4", fecha: "2026-06-05", hora: "17:00", tipo: "Educación canina", profesional: "Educación canina", animal: "Luna", estado: "completada", notas: "Trabajo de habituación al transporte y refuerzo positivo." },
];

const horarios = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "16:00", "16:30", "17:00", "17:30"];

function formatFecha(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export function CitasPage() {
  const [tab, setTab] = useState<"proximas" | "nueva">("proximas");
  const [citas, setCitas] = useState(citasData);
  const [expandedCita, setExpandedCita] = useState<string | null>(null);
  const [form, setForm] = useState({ fecha: "", hora: "", tipo: "" as Especialidad | "", animal: "Luna", notas: "" });
  const [formSent, setFormSent] = useState(false);

  const hoy = "2026-07-27";
  const proximas = citas.filter(c => c.fecha >= hoy && c.estado !== "cancelada" && c.estado !== "completada");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.tipo) return;
    const profesional = profesionalPorEspecialidad[form.tipo];
    const nueva: Cita = {
      id: String(Date.now()),
      fecha: form.fecha,
      hora: form.hora,
      tipo: form.tipo,
      profesional,
      animal: form.animal,
      notas: form.notas || undefined,
      estado: "pendiente",
    };
    setCitas(prev => [nueva, ...prev]);
    setFormSent(true);
    setTimeout(() => {
      setFormSent(false);
      setTab("proximas");
      setForm({ fecha: "", hora: "", tipo: "", animal: "Luna", notas: "" });
    }, 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold" style={{ color: brand.ciruela }}>Citas</h1>
        <p className="text-sm mt-1" style={{ color: brand.carbonMuted }}>
          Coordina encuentros con el equipo cooperativo
        </p>
      </div>

      <div
        className="flex gap-0"
        style={{ background: brand.cremaCard, border: `1px solid ${brand.border}`, borderRadius: "0.375rem", padding: "3px" }}
      >
        {[
          { id: "proximas" as const, label: `Próximas (${proximas.length})` },
          { id: "nueva" as const, label: "Pedir cita" },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex-1 py-2 text-sm font-medium rounded transition-all"
            style={{
              background: tab === t.id ? brand.mostaza : "transparent",
              color: tab === t.id ? brand.carbon : brand.carbonMuted,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "proximas" && (
        <div className="space-y-3">
          {proximas.length === 0 ? (
            <div
              className="rounded-lg p-8 text-center"
              style={{ background: brand.cremaCard, border: `1px solid ${brand.border}` }}
            >
              <CalendarDays size={32} className="mx-auto mb-2" style={{ color: brand.carbonFaint }} />
              <p className="text-sm font-medium" style={{ color: brand.carbonMuted }}>No hay citas próximas</p>
              <button
                onClick={() => setTab("nueva")}
                className="mt-3 text-xs font-medium px-3 py-1.5 rounded"
                style={{ background: brand.mostaza, color: brand.carbon }}
              >
                Pedir cita
              </button>
            </div>
          ) : (
            proximas.map(cita => {
              const expanded = expandedCita === cita.id;
              return (
                <div
                  key={cita.id}
                  className="rounded-lg overflow-hidden transition-all"
                  style={{ background: brand.cremaCard, border: `1px solid ${brand.border}` }}
                >
                  <button
                    className="w-full flex items-center gap-4 px-5 py-4 text-left"
                    onClick={() => setExpandedCita(expanded ? null : cita.id)}
                  >
                    <div
                      className="w-12 h-12 rounded-lg flex flex-col items-center justify-center flex-shrink-0"
                      style={{ background: brand.ciruelaSoft }}
                    >
                      <span className="text-xs font-bold font-display" style={{ color: brand.ciruela, lineHeight: 1 }}>
                        {new Date(cita.fecha + "T12:00:00").getDate()}
                      </span>
                      <span className="text-xs" style={{ color: brand.carbonMuted }}>
                        {new Date(cita.fecha + "T12:00:00").toLocaleString("es-ES", { month: "short" })}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold truncate" style={{ color: brand.carbon }}>{cita.tipo}</p>
                        {cita.soloProfesional && (
                          <span
                            className="text-xs px-1.5 py-0.5 rounded flex-shrink-0"
                            style={{ background: brand.azulNocheSoft, color: brand.azulNoche }}
                          >
                            Equipo
                          </span>
                        )}
                      </div>
                      <p className="text-xs mt-0.5 truncate" style={{ color: brand.carbonMuted }}>
                        {cita.hora} h · {cita.profesional} · {cita.animal}
                      </p>
                    </div>
                    <ChevronDown
                      size={16}
                      className={`flex-shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
                      style={{ color: brand.carbonMuted }}
                    />
                  </button>
                  {expanded && (
                    <div className="px-5 pb-4 space-y-3" style={{ borderTop: `1px solid ${brand.border}` }}>
                      <div className="grid grid-cols-2 gap-3 pt-3">
                        <div>
                          <p className="text-xs" style={{ color: brand.carbonMuted }}>Fecha completa</p>
                          <p className="text-sm font-medium mt-0.5 capitalize" style={{ color: brand.carbon }}>
                            {formatFecha(cita.fecha)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs" style={{ color: brand.carbonMuted }}>Animal</p>
                          <p className="text-sm font-medium mt-0.5" style={{ color: brand.carbon }}>{cita.animal}</p>
                        </div>
                      </div>
                      {cita.notas && (
                        <div className="p-3 rounded" style={{ background: brand.crema }}>
                          <p className="text-xs font-medium mb-1" style={{ color: brand.carbonMuted }}>Notas</p>
                          <p className="text-sm" style={{ color: brand.carbon }}>{cita.notas}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
          <button
            onClick={() => setTab("nueva")}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all"
            style={{ background: brand.mostazaSoft, color: brand.carbon, border: `1px dashed ${brand.mostaza}66` }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = brand.mostaza}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = brand.mostazaSoft}
          >
            <Plus size={16} />
            Pedir nueva cita
          </button>
        </div>
      )}

      {tab === "nueva" && (
        <div className="rounded-lg" style={{ background: brand.cremaCard, border: `1px solid ${brand.border}` }}>
          <div className="px-5 py-4" style={{ borderBottom: `1px solid ${brand.border}` }}>
            <h3 className="font-display text-base font-semibold" style={{ color: brand.ciruela }}>
              Solicitar nueva cita
            </h3>
            <p className="text-xs mt-0.5" style={{ color: brand.carbonMuted }}>
              Cuéntanos qué necesitáis y el equipo te responderá
            </p>
          </div>
          {formSent ? (
            <div className="p-8 flex flex-col items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: brand.successSoft }}
              >
                <Check size={24} style={{ color: brand.success }} />
              </div>
              <p className="text-sm font-semibold" style={{ color: brand.carbon }}>Solicitud enviada</p>
              <p className="text-xs text-center" style={{ color: brand.carbonMuted }}>
                Te confirmaremos la cita en breve.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium" style={{ color: brand.carbon }}>Animal</label>
                  <select
                    value={form.animal}
                    onChange={e => setForm(f => ({ ...f, animal: e.target.value }))}
                    className="w-full px-3 py-2 rounded text-sm outline-none"
                    style={{ background: brand.crema, border: `1px solid ${brand.borderStrong}`, color: brand.carbon }}
                  >
                    <option>Luna</option>
                    <option>Rocky</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium" style={{ color: brand.carbon }}>Especialidad</label>
                  <select
                    value={form.tipo}
                    onChange={e => setForm(f => ({ ...f, tipo: e.target.value as Especialidad | "" }))}
                    required
                    className="w-full px-3 py-2 rounded text-sm outline-none"
                    style={{ background: brand.crema, border: `1px solid ${brand.borderStrong}`, color: brand.carbon }}
                  >
                    <option value="">Seleccionar…</option>
                    {especialidades.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium" style={{ color: brand.carbon }}>Fecha</label>
                  <input
                    type="date"
                    value={form.fecha}
                    onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
                    min={hoy}
                    required
                    className="w-full px-3 py-2 rounded text-sm outline-none"
                    style={{ background: brand.crema, border: `1px solid ${brand.borderStrong}`, color: brand.carbon }}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium" style={{ color: brand.carbon }}>Hora</label>
                  <select
                    value={form.hora}
                    onChange={e => setForm(f => ({ ...f, hora: e.target.value }))}
                    required
                    className="w-full px-3 py-2 rounded text-sm outline-none"
                    style={{ background: brand.crema, border: `1px solid ${brand.borderStrong}`, color: brand.carbon }}
                  >
                    <option value="">Seleccionar…</option>
                    {horarios.map(h => <option key={h}>{h}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-medium" style={{ color: brand.carbon }}>Notas adicionales</label>
                  <textarea
                    value={form.notas}
                    onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                    rows={3}
                    placeholder="Cuéntanos el motivo de la consulta o lo que os preocupa…"
                    className="w-full px-3 py-2 rounded text-sm outline-none resize-none"
                    style={{ background: brand.crema, border: `1px solid ${brand.borderStrong}`, color: brand.carbon }}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setTab("proximas")}
                  className="px-4 py-2 rounded text-sm font-medium transition-all"
                  style={{ background: brand.crema, color: brand.carbonMuted }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded text-sm font-semibold transition-all"
                  style={{ background: brand.mostaza, color: brand.carbon }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = brand.mostazaHover}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = brand.mostaza}
                >
                  Solicitar cita
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

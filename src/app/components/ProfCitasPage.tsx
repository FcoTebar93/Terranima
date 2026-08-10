import { useMemo, useState } from "react";
import { CalendarDays, Check, X, Plus, ChevronDown, MapPin } from "lucide-react";
import { brand, Especialidad } from "../brand";
import { citasDemoIniciales, CitaDemo, familiasDemo } from "../demoData";

interface ProfCitasPageProps {
  especialidad: Especialidad;
  profesionalNombre: string;
  onPendingCountChange?: (n: number) => void;
}

const tiposProfesional = ["Grupo de desarrollo", "Dog café", "Educación canina", "Nutrición", "Terapia familiar"] as const;
const horarios = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "16:00", "16:30", "17:00", "17:30"];

function formatFecha(dateStr: string) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const estadoStyle: Record<string, { bg: string; color: string; label: string }> = {
  pendiente: { bg: brand.mostazaSoft, color: brand.carbon, label: "Pendiente" },
  confirmada: { bg: brand.successSoft, color: brand.success, label: "Confirmada" },
  rechazada: { bg: brand.dangerSoft, color: brand.danger, label: "Rechazada" },
  cancelada: { bg: brand.dangerSoft, color: brand.danger, label: "Cancelada" },
  completada: { bg: brand.azulNocheSoft, color: brand.azulNoche, label: "Completada" },
};

export function ProfCitasPage({ especialidad, profesionalNombre }: ProfCitasPageProps) {
  const [tab, setTab] = useState<"pendientes" | "agenda" | "nueva">("pendientes");
  const [citas, setCitas] = useState<CitaDemo[]>(citasDemoIniciales);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [form, setForm] = useState({
    fecha: "",
    hora: "",
    tipo: especialidad === "Educación canina" ? "Grupo de desarrollo" : especialidad,
    familiaId: familiasDemo[0].id,
    animal: familiasDemo[0].animales[0]?.nombre ?? "",
    notas: "",
  });

  const hoy = "2026-07-27";
  const mias = useMemo(
    () => citas.filter(c => c.profesional === especialidad),
    [citas, especialidad]
  );
  const pendientes = mias.filter(c => c.estado === "pendiente");
  const agenda = mias
    .filter(c => c.fecha >= hoy && (c.estado === "confirmada" || c.estado === "pendiente"))
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora));

  const familiaSel = familiasDemo.find(f => f.id === form.familiaId) ?? familiasDemo[0];

  const setEstado = (id: string, estado: CitaDemo["estado"]) => {
    setCitas(prev => prev.map(c => (c.id === id ? { ...c, estado } : c)));
  };

  const handleCrear = (e: React.FormEvent) => {
    e.preventDefault();
    const fam = familiasDemo.find(f => f.id === form.familiaId)!;
    const nueva: CitaDemo = {
      id: String(Date.now()),
      fecha: form.fecha,
      hora: form.hora,
      tipo: form.tipo,
      profesional: especialidad,
      animal: form.animal || "Familia",
      familia: fam.nombre,
      tutor: fam.tutor,
      estado: "confirmada",
      notas: form.notas || undefined,
      soloProfesional: form.tipo === "Grupo de desarrollo" || form.tipo === "Dog café",
    };
    setCitas(prev => [nueva, ...prev]);
    setTab("agenda");
    setForm(f => ({ ...f, fecha: "", hora: "", notas: "" }));
  };

  const renderCita = (cita: CitaDemo, showActions: boolean) => {
    const st = estadoStyle[cita.estado] ?? estadoStyle.pendiente;
    const open = expanded === cita.id;
    const fam = familiasDemo.find(f => f.nombre === cita.familia);
    return (
      <div
        key={cita.id}
        className="rounded-lg overflow-hidden"
        style={{ background: brand.cremaCard, border: `1px solid ${brand.border}` }}
      >
        <button
          type="button"
          className="w-full flex items-center gap-4 px-5 py-4 text-left"
          onClick={() => setExpanded(open ? null : cita.id)}
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
              <span className="text-xs px-1.5 py-0.5 rounded flex-shrink-0" style={{ background: st.bg, color: st.color }}>
                {st.label}
              </span>
            </div>
            <p className="text-xs mt-0.5 truncate" style={{ color: brand.carbonMuted }}>
              {cita.hora} h · {cita.familia} · {cita.animal}
            </p>
          </div>
          <ChevronDown
            size={16}
            className={`flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
            style={{ color: brand.carbonMuted }}
          />
        </button>

        {open && (
          <div className="px-5 pb-4 space-y-3" style={{ borderTop: `1px solid ${brand.border}` }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
              <div>
                <p className="text-xs" style={{ color: brand.carbonMuted }}>Fecha</p>
                <p className="text-sm font-medium mt-0.5 capitalize" style={{ color: brand.carbon }}>
                  {formatFecha(cita.fecha)}
                </p>
              </div>
              <div>
                <p className="text-xs" style={{ color: brand.carbonMuted }}>Tutor/a</p>
                <p className="text-sm font-medium mt-0.5" style={{ color: brand.carbon }}>{cita.tutor}</p>
              </div>
              {fam && (
                <div className="sm:col-span-2">
                  <p className="text-xs" style={{ color: brand.carbonMuted }}>Domicilio</p>
                  <p className="text-sm font-medium mt-0.5 flex items-start gap-1.5" style={{ color: brand.carbon }}>
                    <MapPin size={14} className="mt-0.5 flex-shrink-0" style={{ color: brand.mostaza }} />
                    {fam.direccion}
                  </p>
                </div>
              )}
            </div>
            {cita.notas && (
              <div className="p-3 rounded" style={{ background: brand.crema }}>
                <p className="text-xs font-medium mb-1" style={{ color: brand.carbonMuted }}>Notas</p>
                <p className="text-sm" style={{ color: brand.carbon }}>{cita.notas}</p>
              </div>
            )}
            {showActions && cita.estado === "pendiente" && (
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setEstado(cita.id, "confirmada")}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded text-sm font-semibold"
                  style={{ background: brand.mostaza, color: brand.carbon }}
                >
                  <Check size={16} /> Aceptar
                </button>
                <button
                  type="button"
                  onClick={() => setEstado(cita.id, "rechazada")}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded text-sm font-semibold"
                  style={{ background: brand.dangerSoft, color: brand.danger }}
                >
                  <X size={16} /> Rechazar
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold" style={{ color: brand.ciruela }}>Citas</h1>
        <p className="text-sm mt-1" style={{ color: brand.carbonMuted }}>
          {profesionalNombre} · {especialidad}
        </p>
      </div>

      <div
        className="flex gap-0"
        style={{ background: brand.cremaCard, border: `1px solid ${brand.border}`, borderRadius: "0.375rem", padding: "3px" }}
      >
        {[
          { id: "pendientes" as const, label: `Pendientes (${pendientes.length})` },
          { id: "agenda" as const, label: `Agenda (${agenda.length})` },
          { id: "nueva" as const, label: "Nueva cita" },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex-1 py-2 text-xs sm:text-sm font-medium rounded transition-all"
            style={{
              background: tab === t.id ? brand.mostaza : "transparent",
              color: tab === t.id ? brand.carbon : brand.carbonMuted,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "pendientes" && (
        <div className="space-y-3">
          {pendientes.length === 0 ? (
            <div className="rounded-lg p-8 text-center" style={{ background: brand.cremaCard, border: `1px solid ${brand.border}` }}>
              <CalendarDays size={32} className="mx-auto mb-2" style={{ color: brand.carbonFaint }} />
              <p className="text-sm font-medium" style={{ color: brand.carbonMuted }}>No hay solicitudes pendientes</p>
            </div>
          ) : (
            pendientes.map(c => renderCita(c, true))
          )}
        </div>
      )}

      {tab === "agenda" && (
        <div className="space-y-3">
          {agenda.length === 0 ? (
            <div className="rounded-lg p-8 text-center" style={{ background: brand.cremaCard, border: `1px solid ${brand.border}` }}>
              <CalendarDays size={32} className="mx-auto mb-2" style={{ color: brand.carbonFaint }} />
              <p className="text-sm font-medium" style={{ color: brand.carbonMuted }}>No hay citas en agenda</p>
            </div>
          ) : (
            agenda.map(c => renderCita(c, true))
          )}
        </div>
      )}

      {tab === "nueva" && (
        <div className="rounded-lg" style={{ background: brand.cremaCard, border: `1px solid ${brand.border}` }}>
          <div className="px-5 py-4" style={{ borderBottom: `1px solid ${brand.border}` }}>
            <h3 className="font-display text-base font-semibold" style={{ color: brand.ciruela }}>
              Crear cita
            </h3>
            <p className="text-xs mt-0.5" style={{ color: brand.carbonMuted }}>
              Incluye grupos de desarrollo y Dog café (solo equipo)
            </p>
          </div>
          <form onSubmit={handleCrear} className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-medium" style={{ color: brand.carbon }}>Familia</label>
                <select
                  value={form.familiaId}
                  onChange={e => {
                    const fam = familiasDemo.find(f => f.id === e.target.value)!;
                    setForm(f => ({
                      ...f,
                      familiaId: fam.id,
                      animal: fam.animales[0]?.nombre ?? "Familia",
                    }));
                  }}
                  className="w-full px-3 py-2 rounded text-sm outline-none"
                  style={{ background: brand.crema, border: `1px solid ${brand.borderStrong}`, color: brand.carbon }}
                >
                  {familiasDemo.map(f => (
                    <option key={f.id} value={f.id}>{f.nombre}</option>
                  ))}
                </select>
                <p className="text-xs flex items-center gap-1" style={{ color: brand.carbonMuted }}>
                  <MapPin size={12} /> {familiaSel.direccion}
                </p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium" style={{ color: brand.carbon }}>Animal</label>
                <select
                  value={form.animal}
                  onChange={e => setForm(f => ({ ...f, animal: e.target.value }))}
                  className="w-full px-3 py-2 rounded text-sm outline-none"
                  style={{ background: brand.crema, border: `1px solid ${brand.borderStrong}`, color: brand.carbon }}
                >
                  <option value="Familia">Toda la familia</option>
                  {familiaSel.animales.map(a => (
                    <option key={a.id} value={a.nombre}>{a.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium" style={{ color: brand.carbon }}>Tipo</label>
                <select
                  value={form.tipo}
                  onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                  className="w-full px-3 py-2 rounded text-sm outline-none"
                  style={{ background: brand.crema, border: `1px solid ${brand.borderStrong}`, color: brand.carbon }}
                >
                  {tiposProfesional.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium" style={{ color: brand.carbon }}>Fecha</label>
                <input
                  type="date"
                  required
                  min={hoy}
                  value={form.fecha}
                  onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
                  className="w-full px-3 py-2 rounded text-sm outline-none"
                  style={{ background: brand.crema, border: `1px solid ${brand.borderStrong}`, color: brand.carbon }}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium" style={{ color: brand.carbon }}>Hora</label>
                <select
                  required
                  value={form.hora}
                  onChange={e => setForm(f => ({ ...f, hora: e.target.value }))}
                  className="w-full px-3 py-2 rounded text-sm outline-none"
                  style={{ background: brand.crema, border: `1px solid ${brand.borderStrong}`, color: brand.carbon }}
                >
                  <option value="">Seleccionar…</option>
                  {horarios.map(h => <option key={h}>{h}</option>)}
                </select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-medium" style={{ color: brand.carbon }}>Notas</label>
                <textarea
                  rows={3}
                  value={form.notas}
                  onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                  className="w-full px-3 py-2 rounded text-sm outline-none resize-none"
                  style={{ background: brand.crema, border: `1px solid ${brand.borderStrong}`, color: brand.carbon }}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2 rounded text-sm font-semibold"
                style={{ background: brand.mostaza, color: brand.carbon }}
              >
                <Plus size={16} /> Crear cita
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

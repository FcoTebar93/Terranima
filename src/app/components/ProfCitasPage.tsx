import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Check, X, ChevronDown, MapPin, Plus } from "lucide-react";
import { brand, Especialidad, animalCompatibleConEspecialidad, esCitaSoloProfesional } from "../brand";
import { citasDemoIniciales, CitaDemo, familiasDemo } from "../demoData";
import {
  createCita,
  fetchCitas,
  fetchFamilias,
  patchCitaEstado,
  TerranimaApiError,
  type ApiCita,
  type ApiFamilia,
} from "../api/terranima";
import { isWpEmbedded } from "../wpConfig";
import type { ProfFocus } from "../profNav";

interface ProfCitasPageProps {
  especialidad: Especialidad;
  profesionalNombre: string;
  onPendingCountChange?: (n: number) => void;
  focus?: ProfFocus;
}

type FamiliaOption = {
  id: string;
  nombre: string;
  tutor: string;
  animales: Array<{ id: string; nombre: string; especie?: string }>;
};

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

function hoyIso() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export function ProfCitasPage({ especialidad, profesionalNombre, onPendingCountChange, focus }: ProfCitasPageProps) {
  const wpMode = isWpEmbedded();
  const [tab, setTab] = useState<"pendientes" | "agenda" | "nueva">(focus?.openCreate ? "nueva" : "pendientes");
  const [citas, setCitas] = useState<ApiCita[]>(() =>
    wpMode ? [] : citasDemoIniciales.filter(c => c.profesional === especialidad)
  );
  const [familias, setFamilias] = useState<FamiliaOption[]>(() =>
    wpMode
      ? []
      : familiasDemo.map(f => ({
          id: f.id,
          nombre: f.nombre,
          tutor: f.tutor,
          animales: f.animales.map(a => ({ id: a.id, nombre: a.nombre, especie: a.especie })),
        }))
  );
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(wpMode);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formSent, setFormSent] = useState(false);
  const [form, setForm] = useState({
    familiaId: focus?.familiaId ?? "",
    animal: focus?.animalNombre ?? "",
    tipo: especialidad as string,
    fecha: "",
    hora: "",
    notas: "",
  });

  const hoy = wpMode ? hoyIso() : "2026-07-27";

  useEffect(() => {
    if (!wpMode) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([fetchCitas(), fetchFamilias()])
      .then(([list, famList]) => {
        if (cancelled) return;
        setCitas(list);
        const mapped: FamiliaOption[] = famList.map((f: ApiFamilia) => ({
          id: String(f.id),
          nombre: f.nombre,
          tutor: f.tutor,
          animales: f.animales.map(a => ({ id: a.id, nombre: a.nombre, especie: a.especie })),
        }));
        setFamilias(mapped);
      })
      .catch(err => {
        if (cancelled) return;
        setError(err instanceof TerranimaApiError ? err.message : "No se pudieron cargar las citas.");
        setCitas(citasDemoIniciales.filter(c => c.profesional === especialidad));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [wpMode, especialidad]);

  useEffect(() => {
    if (focus?.openCreate) setTab("nueva");
    if (focus?.familiaId) {
      setForm(f => ({
        ...f,
        familiaId: focus.familiaId ?? f.familiaId,
        animal: focus.animalNombre ?? f.animal,
      }));
    }
  }, [focus]);

  const mias = useMemo(() => {
    if (wpMode) return citas;
    return citas.filter(c => c.profesional === especialidad);
  }, [citas, especialidad, wpMode]);

  const pendientes = mias
    .filter(c => c.estado === "pendiente")
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora));
  const agenda = mias
    .filter(c => c.fecha >= hoy && c.estado === "confirmada")
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora));

  useEffect(() => {
    onPendingCountChange?.(pendientes.length);
  }, [pendientes.length, onPendingCountChange]);

  const setEstado = async (id: string, estado: CitaDemo["estado"]) => {
    setSavingId(id);
    setError("");
    try {
      if (wpMode) {
        const updated = await patchCitaEstado(id, estado);
        setCitas(prev => prev.map(c => (c.id === id ? { ...c, ...updated } : c)));
      } else {
        setCitas(prev => prev.map(c => (c.id === id ? { ...c, estado } : c)));
      }
    } catch (err) {
      setError(err instanceof TerranimaApiError ? err.message : "No se pudo actualizar la cita.");
    } finally {
      setSavingId(null);
    }
  };

  const familiaForm = familias.find(f => f.id === form.familiaId) ?? familias[0];
  const tiposSesion = especialidad === "Educación canina"
    ? ["Educación canina", "Grupo de desarrollo"]
    : [especialidad];
  const animalesForm = useMemo(
    () => (familiaForm?.animales ?? []).filter(a =>
      animalCompatibleConEspecialidad(a.especie || "", especialidad)
    ),
    [familiaForm, especialidad]
  );
  const esGrupoFamiliar = form.tipo === "Dog café";

  useEffect(() => {
    if (!form.familiaId && familias[0]) {
      const first = familias[0].animales.find(a =>
        animalCompatibleConEspecialidad(a.especie || "", especialidad)
      ) ?? familias[0].animales[0];
      setForm(f => ({
        ...f,
        familiaId: familias[0].id,
        animal: f.animal || first?.nombre || "",
      }));
    }
  }, [familias, form.familiaId, especialidad]);

  useEffect(() => {
    if (!familiaForm) return;
    if (esGrupoFamiliar) return;
    const names = animalesForm.map(a => a.nombre);
    if (names.length && form.animal && !names.includes(form.animal)) {
      setForm(f => ({ ...f, animal: names[0] }));
    }
  }, [familiaForm, form.animal, animalesForm, esGrupoFamiliar]);

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    const fam = familias.find(f => f.id === form.familiaId) ?? familias[0];
    if (!fam || !form.fecha || !form.hora) return;
    const tipoSesion = form.tipo || especialidad;
    const soloProfesional = esCitaSoloProfesional(tipoSesion);
    const animal = esGrupoFamiliar
      ? "Familia"
      : (form.animal || animalesForm[0]?.nombre || fam.animales[0]?.nombre || "Familia");
    setSubmitting(true);
    setError("");
    try {
      if (wpMode) {
        const created = await createCita({
          fecha: form.fecha,
          hora: form.hora,
          tipo: tipoSesion,
          animal,
          notas: form.notas,
          familiaUserId: Number(fam.id),
          soloProfesional,
        });
        setCitas(prev => [{ ...created, estado: created.estado || "confirmada", soloProfesional }, ...prev]);
      } else {
        const nueva: ApiCita = {
          id: String(Date.now()),
          fecha: form.fecha,
          hora: form.hora,
          tipo: tipoSesion,
          profesional: especialidad,
          animal,
          familia: fam.nombre,
          tutor: fam.tutor,
          estado: "confirmada",
          notas: form.notas || undefined,
          soloProfesional,
        };
        setCitas(prev => [nueva, ...prev]);
      }
      setFormSent(true);
      setTimeout(() => {
        setFormSent(false);
        setTab("agenda");
        setForm(f => ({ ...f, fecha: "", hora: "", notas: "" }));
      }, 1200);
    } catch (err) {
      setError(err instanceof TerranimaApiError ? err.message : "No se pudo crear la cita.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderCita = (cita: ApiCita, showActions: boolean) => {
    const st = estadoStyle[cita.estado] ?? estadoStyle.pendiente;
    const open = expanded === cita.id;
    const fam = familiasDemo.find(f => f.nombre === cita.familia);
    const direccion = cita.direccion || fam?.direccion || "";
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
              {cita.soloProfesional && (
                <span
                  className="text-xs px-1.5 py-0.5 rounded flex-shrink-0"
                  style={{ background: brand.azulNocheSoft, color: brand.azulNoche }}
                >
                  Solo equipo
                </span>
              )}
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
              {direccion && (
                <div className="sm:col-span-2">
                  <p className="text-xs" style={{ color: brand.carbonMuted }}>Domicilio</p>
                  <p className="text-sm font-medium mt-0.5 flex items-start gap-1.5" style={{ color: brand.carbon }}>
                    <MapPin size={14} className="mt-0.5 flex-shrink-0" style={{ color: brand.mostaza }} />
                    {direccion}
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
                  disabled={savingId === cita.id}
                  onClick={() => setEstado(cita.id, "confirmada")}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded text-sm font-semibold disabled:opacity-60"
                  style={{ background: brand.mostaza, color: brand.carbon }}
                >
                  <Check size={16} /> Aceptar
                </button>
                <button
                  type="button"
                  disabled={savingId === cita.id}
                  onClick={() => setEstado(cita.id, "rechazada")}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded text-sm font-semibold disabled:opacity-60"
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

      {error && (
        <p className="text-sm px-3 py-2 rounded" style={{ background: brand.dangerSoft, color: brand.danger }}>
          {error}
        </p>
      )}

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

      {loading && tab !== "nueva" ? (
        <p className="text-sm text-center py-8" style={{ color: brand.carbonMuted }}>Cargando citas…</p>
      ) : tab === "pendientes" ? (
        <div className="space-y-3">
          {pendientes.length === 0 ? (
            <div className="rounded-lg p-8 text-center" style={{ background: brand.cremaCard, border: `1px solid ${brand.border}` }}>
              <CalendarDays size={32} className="mx-auto mb-2" style={{ color: brand.carbonFaint }} />
              <p className="text-sm font-medium" style={{ color: brand.carbonMuted }}>No hay solicitudes pendientes</p>
              <button
                type="button"
                onClick={() => setTab("nueva")}
                className="mt-3 text-xs font-medium px-3 py-1.5 rounded"
                style={{ background: brand.mostaza, color: brand.carbon }}
              >
                Programar cita
              </button>
            </div>
          ) : (
            pendientes.map(c => renderCita(c, true))
          )}
        </div>
      ) : tab === "agenda" ? (
        <div className="space-y-3">
          {agenda.length === 0 ? (
            <div className="rounded-lg p-8 text-center" style={{ background: brand.cremaCard, border: `1px solid ${brand.border}` }}>
              <CalendarDays size={32} className="mx-auto mb-2" style={{ color: brand.carbonFaint }} />
              <p className="text-sm font-medium" style={{ color: brand.carbonMuted }}>No hay citas en agenda</p>
              <button
                type="button"
                onClick={() => setTab("nueva")}
                className="mt-3 text-xs font-medium px-3 py-1.5 rounded"
                style={{ background: brand.mostaza, color: brand.carbon }}
              >
                Programar cita
              </button>
            </div>
          ) : (
            agenda.map(c => renderCita(c, false))
          )}
          <button
            type="button"
            onClick={() => setTab("nueva")}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium"
            style={{ background: brand.mostazaSoft, color: brand.carbon, border: `1px dashed ${brand.mostaza}66` }}
          >
            <Plus size={16} /> Programar nueva cita
          </button>
        </div>
      ) : (
        <div className="rounded-lg" style={{ background: brand.cremaCard, border: `1px solid ${brand.border}` }}>
          <div className="px-5 py-4" style={{ borderBottom: `1px solid ${brand.border}` }}>
            <h3 className="font-display text-base font-semibold" style={{ color: brand.ciruela }}>
              Programar cita
            </h3>
            <p className="text-xs mt-0.5" style={{ color: brand.carbonMuted }}>
              Queda confirmada en la agenda de {especialidad}
            </p>
          </div>
          {formSent ? (
            <div className="p-8 flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: brand.successSoft }}>
                <Check size={24} style={{ color: brand.success }} />
              </div>
              <p className="text-sm font-semibold" style={{ color: brand.carbon }}>Cita programada</p>
            </div>
          ) : (
            <form onSubmit={e => void handleCrear(e)} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-medium" style={{ color: brand.carbon }}>Familia</label>
                  <select
                    value={form.familiaId}
                    onChange={e => {
                      const id = e.target.value;
                      const fam = familias.find(f => f.id === id);
                      const first = fam?.animales.find(a =>
                        animalCompatibleConEspecialidad(a.especie || "", especialidad)
                      );
                      setForm(f => ({ ...f, familiaId: id, animal: first?.nombre ?? "" }));
                    }}
                    required
                    className="w-full px-3 py-2 rounded text-sm outline-none"
                    style={{ background: brand.crema, border: `1px solid ${brand.borderStrong}`, color: brand.carbon }}
                  >
                    {familias.length === 0 ? (
                      <option value="">Sin familias asignadas</option>
                    ) : (
                      familias.map(f => (
                        <option key={f.id} value={f.id}>{f.nombre} — {f.tutor}</option>
                      ))
                    )}
                  </select>
                </div>
                {tiposSesion.length > 1 ? (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium" style={{ color: brand.carbon }}>Tipo de sesión</label>
                    <select
                      value={form.tipo}
                      onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                      className="w-full px-3 py-2 rounded text-sm outline-none"
                      style={{ background: brand.crema, border: `1px solid ${brand.borderStrong}`, color: brand.carbon }}
                    >
                      {tiposSesion.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    {esCitaSoloProfesional(form.tipo) && (
                      <p className="text-xs" style={{ color: brand.carbonMuted }}>
                        La familia lo verá en Próximas citas, pero no puede solicitarlo.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium" style={{ color: brand.carbon }}>Especialidad</label>
                    <input
                      value={especialidad}
                      readOnly
                      className="w-full px-3 py-2 rounded text-sm outline-none"
                      style={{ background: brand.crema, border: `1px solid ${brand.borderStrong}`, color: brand.carbonMuted }}
                    />
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium" style={{ color: brand.carbon }}>Animal</label>
                  {esGrupoFamiliar ? (
                    <input
                      value="Familia"
                      readOnly
                      className="w-full px-3 py-2 rounded text-sm outline-none"
                      style={{ background: brand.crema, border: `1px solid ${brand.borderStrong}`, color: brand.carbonMuted }}
                    />
                  ) : (
                    <select
                      value={form.animal}
                      onChange={e => setForm(f => ({ ...f, animal: e.target.value }))}
                      className="w-full px-3 py-2 rounded text-sm outline-none"
                      style={{ background: brand.crema, border: `1px solid ${brand.borderStrong}`, color: brand.carbon }}
                    >
                      {animalesForm.map(a => (
                        <option key={a.id} value={a.nombre}>{a.nombre}</option>
                      ))}
                    </select>
                  )}
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
                  <label className="text-xs font-medium" style={{ color: brand.carbon }}>Notas</label>
                  <textarea
                    value={form.notas}
                    onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                    rows={3}
                    placeholder="Motivo, objetivos de la sesión…"
                    className="w-full px-3 py-2 rounded text-sm outline-none resize-none"
                    style={{ background: brand.crema, border: `1px solid ${brand.borderStrong}`, color: brand.carbon }}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setTab("agenda")}
                  className="px-4 py-2 rounded text-sm font-medium"
                  style={{ background: brand.crema, color: brand.carbonMuted }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || familias.length === 0}
                  className="px-5 py-2 rounded text-sm font-semibold disabled:opacity-60"
                  style={{ background: brand.mostaza, color: brand.carbon }}
                >
                  {submitting ? "Guardando…" : "Confirmar cita"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

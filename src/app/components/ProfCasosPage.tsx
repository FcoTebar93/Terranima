import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft, CalendarPlus, Camera, Check, Edit2, FileText, Heart, Mail, MapPin, MessageSquare,
  Search, Users, Stethoscope, X,
} from "lucide-react";
import { brand, Especialidad } from "../brand";
import { familiasDemo, type AnimalFicha, type FamiliaDemo, type ProfesionalEquipo } from "../demoData";
import { fetchFamilias, TerranimaApiError, type ApiFamilia } from "../api/terranima";
import { isWpEmbedded } from "../wpConfig";
import type { ProfChatKind, ProfFocus } from "../profNav";

interface Caso {
  id: string;
  nombre: string;
  tutor: string;
  email: string;
  direccion: string;
  numeroSocio?: string;
  animales: AnimalFicha[];
  equipo: ProfesionalEquipo[];
}

interface ProfCasosPageProps {
  especialidad: Especialidad;
  profesionalNombre: string;
  onAction: (section: "chat" | "informes" | "citas", focus: ProfFocus) => void;
}

function mapApi(f: ApiFamilia): Caso {
  return {
    id: String(f.id),
    nombre: f.nombre,
    tutor: f.tutor,
    email: f.email,
    direccion: f.direccion,
    numeroSocio: f.numeroSocio,
    animales: (f.animales ?? []).map(a => ({
      id: a.id,
      nombre: a.nombre,
      especie: a.especie,
      raza: a.raza ?? "—",
      sexo: (a.sexo === "macho" || a.sexo === "hembra" ? a.sexo : "hembra") as AnimalFicha["sexo"],
      edad: a.edad ?? 0,
      fechaNacimiento: a.fechaNacimiento ?? "",
      color: a.color ?? "—",
      peso: a.peso ?? "—",
      microchip: a.microchip ?? "—",
      notasProfesional: a.notasProfesional ?? "",
      notasTutor: a.notasTutor ?? "",
      foto: a.foto,
    })),
    equipo: (f.equipo ?? []).map(p => ({
      id: p.id,
      nombre: p.nombre,
      especialidad: p.especialidad,
    })),
  };
}

function fromDemo(f: FamiliaDemo): Caso {
  return {
    id: f.id,
    nombre: f.nombre,
    tutor: f.tutor,
    email: f.email,
    direccion: f.direccion,
    numeroSocio: f.numeroSocio,
    animales: f.animales,
    equipo: f.equipo ?? [],
  };
}

function formatFecha(dateStr: string) {
  if (!dateStr) return "—";
  return new Date(dateStr + "T12:00:00").toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function inicial(nombre: string) {
  return nombre.slice(0, 1).toUpperCase();
}

function avatarColor(especie: string) {
  return /gato/i.test(especie) ? brand.ciruela : brand.mostaza;
}

export function ProfCasosPage({ especialidad, profesionalNombre, onAction }: ProfCasosPageProps) {
  const wpMode = isWpEmbedded();
  const [casos, setCasos] = useState<Caso[]>(() => (wpMode ? [] : familiasDemo.map(fromDemo)));
  const [loading, setLoading] = useState(wpMode);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [casoId, setCasoId] = useState<string | null>(null);
  const [animalId, setAnimalId] = useState<string | null>(null);
  const [editando, setEditando] = useState<keyof AnimalFicha | null>(null);
  const [valorEdit, setValorEdit] = useState("");
  const fotoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!wpMode) return;
    let cancelled = false;
    setLoading(true);
    fetchFamilias()
      .then(list => {
        if (!cancelled) setCasos(list.map(mapApi));
      })
      .catch(err => {
        if (cancelled) return;
        setError(err instanceof TerranimaApiError ? err.message : "No se pudieron cargar los casos.");
        setCasos(familiasDemo.map(fromDemo));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [wpMode]);

  const filtrados = casos.filter(c => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      c.nombre.toLowerCase().includes(q)
      || c.tutor.toLowerCase().includes(q)
      || c.animales.some(a => a.nombre.toLowerCase().includes(q))
    );
  });

  const caso = casos.find(c => c.id === casoId) ?? null;
  const animal = caso
    ? (caso.animales.find(a => a.id === animalId) ?? caso.animales[0] ?? null)
    : null;

  const go = (section: "chat" | "informes" | "citas", kind?: ProfChatKind, openCreate?: boolean) => {
    if (!caso) return;
    onAction(section, {
      familiaId: caso.id,
      animalNombre: animal?.nombre,
      chatKind: kind,
      openCreate,
    });
  };

  const patchAnimal = (patch: Partial<AnimalFicha>) => {
    if (!caso || !animal) return;
    setCasos(prev => prev.map(c =>
      c.id !== caso.id
        ? c
        : { ...c, animales: c.animales.map(a => (a.id === animal.id ? { ...a, ...patch } : a)) }
    ));
  };

  const startEdit = (key: keyof AnimalFicha) => {
    if (!animal) return;
    setEditando(key);
    setValorEdit(String(animal[key] ?? ""));
  };

  const saveEdit = () => {
    if (!editando) return;
    patchAnimal({ [editando]: valorEdit } as Partial<AnimalFicha>);
    setEditando(null);
  };

  const handleFoto = (files: FileList | null) => {
    if (!files?.[0]) return;
    patchAnimal({ foto: URL.createObjectURL(files[0]) });
  };

  if (caso) {
    return (
      <div className="max-w-3xl mx-auto space-y-5">
        <button
          type="button"
          onClick={() => { setCasoId(null); setAnimalId(null); }}
          className="inline-flex items-center gap-1.5 text-sm"
          style={{ color: brand.carbonMuted }}
        >
          <ArrowLeft size={16} /> Casos asignados
        </button>

        <div
          className="rounded-lg overflow-hidden"
          style={{ background: brand.cremaCard, border: `1px solid ${brand.border}` }}
        >
          <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${brand.ciruela}, ${brand.mostaza})` }} />
          <div className="px-5 py-5 space-y-3">
            <div className="flex items-start gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: brand.ciruelaSoft }}
              >
                <Users size={20} style={{ color: brand.ciruela }} />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="font-display text-xl font-semibold" style={{ color: brand.ciruela }}>
                  {caso.nombre}
                </h1>
                <p className="text-sm mt-0.5" style={{ color: brand.carbon }}>
                  {caso.tutor}
                  {caso.numeroSocio ? ` · ${caso.numeroSocio}` : ""}
                </p>
                <p className="text-xs mt-1 flex items-start gap-1" style={{ color: brand.carbonMuted }}>
                  <MapPin size={12} className="mt-0.5 flex-shrink-0" /> {caso.direccion || "Sin domicilio"}
                </p>
                {caso.email && (
                  <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: brand.carbonMuted }}>
                    <Mail size={12} className="flex-shrink-0" /> {caso.email}
                  </p>
                )}
              </div>
            </div>

            {caso.equipo.length > 0 && (
              <div className="pt-2" style={{ borderTop: `1px solid ${brand.border}` }}>
                <p className="text-xs uppercase tracking-widest mb-2" style={{ color: brand.carbonFaint, letterSpacing: "0.08em" }}>
                  Equipo de seguimiento
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {caso.equipo.map(p => (
                    <span
                      key={String(p.id)}
                      className="text-xs px-2 py-1 rounded"
                      style={{
                        background: p.especialidad === especialidad ? brand.mostazaSoft : brand.azulNocheSoft,
                        color: p.especialidad === especialidad ? brand.carbon : brand.azulNoche,
                      }}
                    >
                      {p.nombre} · {p.especialidad}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { id: "chat-fam", label: "Chat con la familia", icon: <MessageSquare size={18} />, onClick: () => go("chat", "cliente") },
            { id: "chat-eq", label: "Chat interno", icon: <Stethoscope size={18} />, onClick: () => go("chat", "equipo", true) },
            { id: "docs", label: "Ver / subir informes", icon: <FileText size={18} />, onClick: () => go("informes") },
            { id: "cita", label: "Programar cita", icon: <CalendarPlus size={18} />, onClick: () => go("citas", undefined, true) },
          ].map(btn => (
            <button
              key={btn.id}
              type="button"
              onClick={btn.onClick}
              className="flex flex-col items-center justify-center gap-2 rounded-lg px-3 py-4 text-center text-xs font-medium transition-all"
              style={{ background: brand.cremaCard, border: `1px solid ${brand.border}`, color: brand.carbon }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = brand.mostazaSoft}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = brand.cremaCard}
            >
              <span style={{ color: brand.ciruela }}>{btn.icon}</span>
              {btn.label}
            </button>
          ))}
        </div>

        {caso.animales.length > 1 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar-pc [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {caso.animales.map(a => {
              const active = (animal?.id ?? "") === a.id;
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => { setAnimalId(a.id); setEditando(null); }}
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-medium flex-shrink-0"
                  style={{
                    background: active ? brand.ciruela : brand.cremaCard,
                    color: active ? brand.crema : brand.carbon,
                    border: `1px solid ${active ? brand.ciruela : brand.border}`,
                  }}
                >
                  {a.foto ? (
                    <img src={a.foto} alt="" className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <span
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold font-display"
                      style={{
                        background: active ? "rgba(255,255,255,0.2)" : avatarColor(a.especie) + "22",
                        color: active ? brand.crema : avatarColor(a.especie),
                      }}
                    >
                      {inicial(a.nombre)}
                    </span>
                  )}
                  {a.nombre}
                </button>
              );
            })}
          </div>
        )}

        {animal ? (
          <div
            className="rounded-lg overflow-hidden"
            style={{ background: brand.cremaCard, border: `1px solid ${brand.border}` }}
          >
            <div className="px-5 py-4 flex items-center gap-4" style={{ borderBottom: `1px solid ${brand.border}` }}>
              <div className="relative flex-shrink-0">
                {animal.foto ? (
                  <img
                    src={animal.foto}
                    alt={animal.nombre}
                    className="w-14 h-14 rounded-full object-cover"
                    style={{ border: `2px solid ${avatarColor(animal.especie)}33` }}
                  />
                ) : (
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-display font-semibold"
                    style={{ background: avatarColor(animal.especie) + "22", color: avatarColor(animal.especie) }}
                  >
                    {inicial(animal.nombre)}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fotoRef.current?.click()}
                  className="absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-full flex items-center justify-center shadow"
                  style={{ background: brand.mostaza, color: brand.carbon, border: `2px solid ${brand.cremaCard}` }}
                  title="Subir foto del animal"
                >
                  <Camera size={13} />
                </button>
                <input
                  ref={fotoRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={e => handleFoto(e.target.files)}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-display text-lg font-semibold" style={{ color: brand.ciruela }}>
                    {animal.nombre}
                  </h2>
                  <span
                    className="text-xs px-2 py-0.5 rounded uppercase tracking-wider"
                    style={{ background: avatarColor(animal.especie) + "18", color: avatarColor(animal.especie), letterSpacing: "0.06em" }}
                  >
                    {animal.especie}
                  </span>
                </div>
                <p className="text-sm mt-0.5" style={{ color: brand.carbonMuted }}>
                  {animal.raza} · {animal.sexo === "macho" ? "Macho" : "Hembra"}
                  {animal.edad ? ` · ${animal.edad} años` : ""}
                </p>
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-xs" style={{ color: brand.carbonMuted }}>Peso</p>
                <p className="text-xl font-semibold font-display" style={{ color: brand.azulNoche }}>{animal.peso}</p>
              </div>
            </div>

            <div className="divide-y" style={{ borderColor: brand.border }}>
              {([
                { label: "Nombre", key: "nombre" as const, tipo: "text" as const },
                { label: "Especie", key: "especie" as const, tipo: "select" as const, opciones: ["Perro", "Gato", "Conejo", "Ave", "Otro"] },
                { label: "Raza", key: "raza" as const, tipo: "text" as const },
                { label: "Sexo", key: "sexo" as const, tipo: "select" as const, opciones: ["macho", "hembra"] },
                { label: "Color / capa", key: "color" as const, tipo: "text" as const },
                { label: "Peso", key: "peso" as const, tipo: "text" as const },
                { label: "Nacimiento", key: "fechaNacimiento" as const, tipo: "date" as const },
                { label: "Notas del equipo", key: "notasProfesional" as const, tipo: "textarea" as const },
                { label: "Notas de tutor/a", key: "notasTutor" as const, tipo: "textarea" as const },
              ]).map(campo => {
                const isEditing = editando === campo.key;
                const raw = animal[campo.key];
                const display = campo.key === "fechaNacimiento"
                  ? formatFecha(String(raw || ""))
                  : campo.key === "sexo"
                    ? (raw === "macho" ? "Macho" : "Hembra")
                    : (String(raw || "") || "—");
                const isNotas = campo.tipo === "textarea";
                return (
                  <div key={campo.key} className="flex items-start gap-4 px-5 py-3 group">
                    <p className="w-32 flex-shrink-0 text-xs font-medium" style={{ color: brand.carbonMuted }}>{campo.label}</p>
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <div className="flex items-start gap-2">
                          {campo.tipo === "textarea" ? (
                            <textarea
                              className="flex-1 px-2 py-1 rounded text-sm outline-none resize-none"
                              style={{ background: brand.crema, border: `1px solid ${brand.mostaza}`, color: brand.carbon, minHeight: "72px" }}
                              value={valorEdit}
                              onChange={e => setValorEdit(e.target.value)}
                              autoFocus
                            />
                          ) : campo.tipo === "select" ? (
                            <select
                              className="flex-1 px-2 py-1.5 rounded text-sm outline-none"
                              style={{ background: brand.crema, border: `1px solid ${brand.mostaza}`, color: brand.carbon }}
                              value={valorEdit}
                              onChange={e => setValorEdit(e.target.value)}
                              autoFocus
                            >
                              {campo.opciones?.map(o => (
                                <option key={o} value={o}>
                                  {o === "macho" ? "Macho" : o === "hembra" ? "Hembra" : o}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={campo.tipo === "date" ? "date" : "text"}
                              className="flex-1 px-2 py-1.5 rounded text-sm outline-none"
                              style={{ background: brand.crema, border: `1px solid ${brand.mostaza}`, color: brand.carbon }}
                              value={valorEdit}
                              onChange={e => setValorEdit(e.target.value)}
                              autoFocus
                            />
                          )}
                          <button
                            type="button"
                            onClick={saveEdit}
                            className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{ background: brand.successSoft, color: brand.success }}
                          >
                            <Check size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditando(null)}
                            className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{ background: brand.dangerSoft, color: brand.danger }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={`text-sm ${isNotas ? "leading-relaxed" : ""}`}
                            style={{ color: brand.carbon }}
                          >
                            {display}
                          </p>
                          <button
                            type="button"
                            onClick={() => startEdit(campo.key)}
                            className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                            style={{ color: brand.carbonMuted }}
                            title="Editar"
                          >
                            <Edit2 size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-lg p-8 text-center" style={{ background: brand.cremaCard, border: `1px solid ${brand.border}` }}>
            <Heart size={28} className="mx-auto mb-2" style={{ color: brand.carbonFaint }} />
            <p className="text-sm" style={{ color: brand.carbonMuted }}>Esta familia aún no tiene animales en ficha.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold" style={{ color: brand.ciruela }}>Casos</h1>
        <p className="text-sm mt-1" style={{ color: brand.carbonMuted }}>
          {profesionalNombre} · {especialidad} · familias asignadas
        </p>
      </div>

      {error && (
        <p className="text-sm px-3 py-2 rounded" style={{ background: brand.dangerSoft, color: brand.danger }}>
          {error}
        </p>
      )}

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: brand.carbonMuted }} />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar familia, tutor o animal"
          className="w-full pl-8 pr-3 py-2.5 rounded text-sm outline-none"
          style={{ background: brand.cremaCard, border: `1px solid ${brand.border}`, color: brand.carbon }}
        />
      </div>

      {loading ? (
        <p className="text-sm text-center py-8" style={{ color: brand.carbonMuted }}>Cargando casos…</p>
      ) : filtrados.length === 0 ? (
        <div className="rounded-lg p-8 text-center" style={{ background: brand.cremaCard, border: `1px solid ${brand.border}` }}>
          <Users size={32} className="mx-auto mb-2" style={{ color: brand.carbonFaint }} />
          <p className="text-sm font-medium" style={{ color: brand.carbonMuted }}>No hay familias asignadas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtrados.map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setCasoId(c.id);
                setAnimalId(c.animales[0]?.id ?? null);
              }}
              className="w-full rounded-lg px-5 py-4 text-left transition-all"
              style={{ background: brand.cremaCard, border: `1px solid ${brand.border}` }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = brand.crema}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = brand.cremaCard}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: brand.ciruelaSoft }}
                >
                  <Users size={18} style={{ color: brand.ciruela }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: brand.carbon }}>{c.nombre}</p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: brand.carbonMuted }}>{c.tutor}</p>
                  <p className="text-xs mt-1 flex items-start gap-1" style={{ color: brand.carbonFaint }}>
                    <MapPin size={11} className="mt-0.5 flex-shrink-0" /> {c.direccion}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {c.animales.map(a => (
                      <span
                        key={a.id}
                        className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded"
                        style={{ background: brand.mostazaSoft, color: brand.carbon }}
                      >
                        <Heart size={11} /> {a.nombre}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

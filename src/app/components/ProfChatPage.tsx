import { useState, useRef, useEffect } from "react";
import { Send, ArrowLeft, User, Heart, Users, Plus, MapPin, X } from "lucide-react";
import { brand, Especialidad } from "../brand";
import { familiasDemo } from "../demoData";
import {
  createChat,
  fetchChat,
  fetchChats,
  fetchFamilias,
  markChatRead,
  sendChatMessage,
  TerranimaApiError,
  type ApiChat,
  type ApiFamilia,
} from "../api/terranima";
import { isWpEmbedded } from "../wpConfig";

interface Mensaje {
  id: string;
  texto: string;
  autor: "cliente" | "profesional";
  hora: string;
  fecha: string;
  leido: boolean;
}

interface ChatProf {
  id: string;
  familiaId: string;
  familiaNombre: string;
  tutor: string;
  direccion: string;
  ambito: "familia" | "animal";
  animal: string | null;
  mensajes: Mensaje[];
  noLeidos: number;
  preview?: string;
  previewAutor?: "cliente" | "profesional" | null;
}

interface FamiliaOption {
  id: string;
  nombre: string;
  tutor: string;
  direccion: string;
  animales: Array<{ id: string; nombre: string; especie: string }>;
}

interface ProfChatPageProps {
  especialidad: Especialidad;
  profesionalNombre: string;
}

function chatsSeed(especialidad: Especialidad): ChatProf[] {
  const f1 = familiasDemo[0];
  if (especialidad === "Educación canina") {
    return [
      {
        id: "p1",
        familiaId: f1.id,
        familiaNombre: f1.nombre,
        tutor: f1.tutor,
        direccion: f1.direccion,
        ambito: "familia",
        animal: null,
        noLeidos: 1,
        mensajes: [
          { id: "1", texto: "Rocky se pone nervioso con truenos. ¿Podéis acompañarnos?", autor: "cliente", hora: "16:20", fecha: "2026-07-24", leido: true },
          { id: "2", texto: "Claro. Empezamos por un entorno seguro y refuerzo positivo.", autor: "profesional", hora: "17:05", fecha: "2026-07-24", leido: true },
          { id: "3", texto: "Hola María, ¿cómo estáis estos días con los ruidos?", autor: "profesional", hora: "09:30", fecha: "2026-07-27", leido: false },
        ],
      },
    ];
  }
  return [
    {
      id: "p2",
      familiaId: f1.id,
      familiaNombre: f1.nombre,
      tutor: f1.tutor,
      direccion: f1.direccion,
      ambito: "animal",
      animal: "Luna",
      noLeidos: 1,
      mensajes: [
        { id: "1", texto: "Propuesta de ajuste de dieta hipoalergénica para Luna.", autor: "profesional", hora: "08:45", fecha: "2026-07-27", leido: false },
      ],
    },
    {
      id: "p3",
      familiaId: f1.id,
      familiaNombre: f1.nombre,
      tutor: f1.tutor,
      direccion: f1.direccion,
      ambito: "animal",
      animal: "Rocky",
      noLeidos: 0,
      mensajes: [
        { id: "1", texto: "Tras la gastroenteritis, mantenemos dieta blanda unos días más.", autor: "profesional", hora: "11:20", fecha: "2026-07-12", leido: true },
      ],
    },
  ];
}

function mapApiToProf(c: ApiChat): ChatProf {
  return {
    id: c.id,
    familiaId: String(c.familiaUserId ?? ""),
    familiaNombre: c.familiaNombre || "Familia",
    tutor: c.tutor || "",
    direccion: c.direccion || "",
    ambito: c.ambito,
    animal: c.animal,
    mensajes: c.mensajes || [],
    noLeidos: c.noLeidos ?? 0,
    preview: c.preview,
    previewAutor: c.previewAutor,
  };
}

function mapFamilia(f: ApiFamilia): FamiliaOption {
  return {
    id: String(f.id),
    nombre: f.nombre,
    tutor: f.tutor,
    direccion: f.direccion,
    animales: f.animales,
  };
}

function agruparPorFecha(mensajes: Mensaje[]) {
  const grupos: Record<string, Mensaje[]> = {};
  mensajes.forEach(m => {
    if (!grupos[m.fecha]) grupos[m.fecha] = [];
    grupos[m.fecha].push(m);
  });
  return grupos;
}

function hoyIso() {
  return new Date().toISOString().slice(0, 10);
}

function ayerIso() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function formatFechaGrupo(dateStr: string, wpMode: boolean) {
  const hoy = wpMode ? hoyIso() : "2026-07-27";
  const ayer = wpMode ? ayerIso() : "2026-07-26";
  if (dateStr === hoy) return "Hoy";
  if (dateStr === ayer) return "Ayer";
  return new Date(dateStr + "T12:00:00").toLocaleDateString("es-ES", {
    weekday: "long", day: "numeric", month: "long",
  });
}

function preview(chat: ChatProf) {
  const u = chat.mensajes[chat.mensajes.length - 1];
  if (u) return (u.autor === "profesional" ? "Tú: " : "") + u.texto;
  if (chat.preview) return (chat.previewAutor === "profesional" ? "Tú: " : "") + chat.preview;
  return "Sin mensajes";
}

export function ProfChatPage({ especialidad, profesionalNombre }: ProfChatPageProps) {
  const wpMode = isWpEmbedded();
  const [chats, setChats] = useState<ChatProf[]>(() => (wpMode ? [] : chatsSeed(especialidad)));
  const [familias, setFamilias] = useState<FamiliaOption[]>(
    () => (wpMode ? [] : familiasDemo.map(f => ({
      id: f.id,
      nombre: f.nombre,
      tutor: f.tutor,
      direccion: f.direccion,
      animales: f.animales,
    })))
  );
  const [chatActivoId, setChatActivoId] = useState<string | null>(null);
  const [texto, setTexto] = useState("");
  const [nuevoOpen, setNuevoOpen] = useState(false);
  const [familiaId, setFamiliaId] = useState("");
  const [animalId, setAnimalId] = useState("");
  const [loading, setLoading] = useState(wpMode);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const esEducacion = especialidad === "Educación canina";
  const chatActivo = chats.find(c => c.id === chatActivoId) ?? null;
  const familiaForm = familias.find(f => f.id === familiaId) ?? familias[0];

  useEffect(() => {
    if (!wpMode) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([fetchChats(), fetchFamilias()])
      .then(([chatList, famList]) => {
        if (cancelled) return;
        const mappedFam = famList.map(mapFamilia);
        setFamilias(mappedFam);
        if (mappedFam[0]) {
          setFamiliaId(mappedFam[0].id);
          setAnimalId(mappedFam[0].animales[0]?.id ?? "");
        }
        setChats(chatList.map(mapApiToProf));
      })
      .catch(err => {
        if (cancelled) return;
        setError(err instanceof TerranimaApiError ? err.message : "No se pudieron cargar los chats.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [wpMode]);

  useEffect(() => {
    if (!wpMode && !familiaId && familias[0]) {
      setFamiliaId(familias[0].id);
      setAnimalId(familias[0].animales[0]?.id ?? "");
    }
  }, [wpMode, familiaId, familias]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatActivo?.mensajes]);

  const abrirChat = async (id: string) => {
    setChatActivoId(id);
    setTexto("");
    setError("");
    if (wpMode) {
      try {
        const full = await fetchChat(id);
        setChats(prev => prev.map(c => (c.id === id ? { ...mapApiToProf(full), noLeidos: 0 } : c)));
        void markChatRead(id);
      } catch (err) {
        setError(err instanceof TerranimaApiError ? err.message : "No se pudo abrir el chat.");
      }
      return;
    }
    setChats(prev =>
      prev.map(c =>
        c.id === id ? { ...c, noLeidos: 0, mensajes: c.mensajes.map(m => ({ ...m, leido: true })) } : c
      )
    );
  };

  const crearChat = async () => {
    const fam = familias.find(f => f.id === familiaId);
    if (!fam) return;

    if (wpMode) {
      setError("");
      try {
        const animal = esEducacion
          ? undefined
          : (fam.animales.find(a => a.id === animalId) ?? fam.animales[0])?.nombre;
        const created = await createChat({
          familiaUserId: Number(fam.id),
          ambito: esEducacion ? "familia" : "animal",
          animal,
        });
        const mapped = mapApiToProf(created);
        setChats(prev => {
          const exists = prev.find(c => c.id === mapped.id);
          return exists ? prev.map(c => (c.id === mapped.id ? mapped : c)) : [mapped, ...prev];
        });
        setNuevoOpen(false);
        await abrirChat(mapped.id);
      } catch (err) {
        setError(err instanceof TerranimaApiError ? err.message : "No se pudo crear el chat.");
      }
      return;
    }

    if (esEducacion) {
      const existe = chats.find(c => c.familiaId === fam.id && c.ambito === "familia");
      if (existe) {
        setNuevoOpen(false);
        void abrirChat(existe.id);
        return;
      }
      const nuevo: ChatProf = {
        id: String(Date.now()),
        familiaId: fam.id,
        familiaNombre: fam.nombre,
        tutor: fam.tutor,
        direccion: fam.direccion,
        ambito: "familia",
        animal: null,
        noLeidos: 0,
        mensajes: [],
      };
      setChats(prev => [nuevo, ...prev]);
      setNuevoOpen(false);
      void abrirChat(nuevo.id);
      return;
    }

    const animal = fam.animales.find(a => a.id === animalId) ?? fam.animales[0];
    if (!animal) return;
    const existe = chats.find(c => c.familiaId === fam.id && c.animal === animal.nombre);
    if (existe) {
      setNuevoOpen(false);
      void abrirChat(existe.id);
      return;
    }
    const nuevo: ChatProf = {
      id: String(Date.now()),
      familiaId: fam.id,
      familiaNombre: fam.nombre,
      tutor: fam.tutor,
      direccion: fam.direccion,
      ambito: "animal",
      animal: animal.nombre,
      noLeidos: 0,
      mensajes: [],
    };
    setChats(prev => [nuevo, ...prev]);
    setNuevoOpen(false);
    void abrirChat(nuevo.id);
  };

  const enviar = async () => {
    const t = texto.trim();
    if (!t || !chatActivoId || sending) return;

    if (wpMode) {
      setSending(true);
      setError("");
      try {
        const msg = await sendChatMessage(chatActivoId, t);
        setChats(prev =>
          prev.map(c =>
            c.id === chatActivoId
              ? { ...c, mensajes: [...c.mensajes, msg], preview: msg.texto, previewAutor: msg.autor }
              : c
          )
        );
        setTexto("");
      } catch (err) {
        setError(err instanceof TerranimaApiError ? err.message : "No se pudo enviar.");
      } finally {
        setSending(false);
      }
      return;
    }

    const nuevo: Mensaje = {
      id: String(Date.now()),
      texto: t,
      autor: "profesional",
      hora: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
      fecha: "2026-07-27",
      leido: true,
    };
    setChats(prev =>
      prev.map(c => (c.id === chatActivoId ? { ...c, mensajes: [...c.mensajes, nuevo] } : c))
    );
    setTexto("");
  };

  if (!chatActivo) {
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold" style={{ color: brand.ciruela }}>Chats</h1>
            <p className="text-sm mt-1" style={{ color: brand.carbonMuted }}>
              {profesionalNombre} · {especialidad}
              {esEducacion ? " · por familia" : " · por animal"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setNuevoOpen(true)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded text-sm font-semibold flex-shrink-0"
            style={{ background: brand.mostaza, color: brand.carbon }}
          >
            <Plus size={16} /> Nuevo chat
          </button>
        </div>

        {error && (
          <div className="rounded p-3 text-sm" style={{ background: brand.dangerSoft, color: brand.danger }}>
            {error}
          </div>
        )}

        <div className="rounded-lg overflow-hidden" style={{ background: brand.cremaCard, border: `1px solid ${brand.border}` }}>
          {loading ? (
            <div className="p-8 text-center">
              <p className="text-sm" style={{ color: brand.carbonMuted }}>Cargando chats…</p>
            </div>
          ) : chats.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm" style={{ color: brand.carbonMuted }}>Aún no hay chats. Crea el primero.</p>
            </div>
          ) : (
            chats.map((chat, index) => (
              <button
                key={chat.id}
                onClick={() => void abrirChat(chat.id)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all"
                style={{ borderBottom: index < chats.length - 1 ? `1px solid ${brand.border}` : undefined }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = brand.crema}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
              >
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: chat.ambito === "familia" ? brand.mostazaSoft : brand.ciruelaSoft }}
                >
                  {chat.ambito === "familia"
                    ? <Users size={18} style={{ color: brand.carbon }} />
                    : <Heart size={18} style={{ color: brand.ciruela }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: brand.carbon }}>
                    {chat.ambito === "familia" ? chat.familiaNombre : `${chat.animal} · ${chat.familiaNombre}`}
                  </p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: brand.carbonMuted }}>{chat.tutor}</p>
                  <p className="text-xs mt-1 truncate" style={{ color: chat.noLeidos ? brand.carbon : brand.carbonMuted, fontWeight: chat.noLeidos ? 500 : 400 }}>
                    {preview(chat)}
                  </p>
                </div>
                {chat.noLeidos > 0 && (
                  <span
                    className="w-5 h-5 rounded-full text-xs flex items-center justify-center font-semibold"
                    style={{ background: brand.mostaza, color: brand.carbon }}
                  >
                    {chat.noLeidos}
                  </span>
                )}
              </button>
            ))
          )}
        </div>

        {nuevoOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(44,44,42,0.45)" }}
            onClick={() => setNuevoOpen(false)}
          >
            <div
              className="w-full max-w-md rounded-lg p-5 space-y-4"
              style={{ background: brand.cremaCard, border: `1px solid ${brand.border}` }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-semibold" style={{ color: brand.ciruela }}>
                  Nuevo chat
                </h3>
                <button type="button" onClick={() => setNuevoOpen(false)} style={{ color: brand.carbonMuted }}>
                  <X size={18} />
                </button>
              </div>
              <p className="text-xs" style={{ color: brand.carbonMuted }}>
                {esEducacion
                  ? "En educación canina el chat es con toda la familia (terapia conjunta)."
                  : "En nutrición el chat es individualizado por animal."}
              </p>
              {familias.length === 0 ? (
                <p className="text-sm" style={{ color: brand.carbonMuted }}>No hay familias disponibles.</p>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium" style={{ color: brand.carbon }}>Familia / tutor</label>
                    <select
                      value={familiaId}
                      onChange={e => {
                        const id = e.target.value;
                        setFamiliaId(id);
                        const fam = familias.find(f => f.id === id)!;
                        setAnimalId(fam.animales[0]?.id ?? "");
                      }}
                      className="w-full px-3 py-2 rounded text-sm outline-none"
                      style={{ background: brand.crema, border: `1px solid ${brand.borderStrong}`, color: brand.carbon }}
                    >
                      {familias.map(f => (
                        <option key={f.id} value={f.id}>{f.nombre} — {f.tutor}</option>
                      ))}
                    </select>
                    {familiaForm && (
                      <p className="text-xs flex items-start gap-1" style={{ color: brand.carbonMuted }}>
                        <MapPin size={12} className="mt-0.5 flex-shrink-0" /> {familiaForm.direccion}
                      </p>
                    )}
                  </div>
                  {!esEducacion && familiaForm && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium" style={{ color: brand.carbon }}>Animal</label>
                      <select
                        value={animalId}
                        onChange={e => setAnimalId(e.target.value)}
                        className="w-full px-3 py-2 rounded text-sm outline-none"
                        style={{ background: brand.crema, border: `1px solid ${brand.borderStrong}`, color: brand.carbon }}
                      >
                        {familiaForm.animales.map(a => (
                          <option key={a.id} value={a.id}>{a.nombre} ({a.especie})</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => void crearChat()}
                    className="w-full py-2.5 rounded text-sm font-semibold"
                    style={{ background: brand.mostaza, color: brand.carbon }}
                  >
                    Abrir chat
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  const grupos = agruparPorFecha(chatActivo.mensajes);

  return (
    <div className="max-w-2xl mx-auto flex flex-col" style={{ height: "calc(100dvh - 7.5rem)" }}>
      <div
        className="flex items-center gap-3 px-4 py-3.5 rounded-t-lg flex-shrink-0"
        style={{ background: brand.cremaCard, border: `1px solid ${brand.border}` }}
      >
        <button
          onClick={() => setChatActivoId(null)}
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ color: brand.carbonMuted }}
          title="Volver"
        >
          <ArrowLeft size={16} />
        </button>
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: chatActivo.ambito === "familia" ? brand.mostazaSoft : brand.ciruelaSoft }}
        >
          {chatActivo.ambito === "familia"
            ? <Users size={17} style={{ color: brand.carbon }} />
            : <Heart size={17} style={{ color: brand.ciruela }} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display text-sm font-semibold truncate" style={{ color: brand.ciruela }}>
            {chatActivo.ambito === "familia"
              ? chatActivo.familiaNombre
              : `${chatActivo.animal} · ${chatActivo.familiaNombre}`}
          </p>
          <p className="text-xs truncate flex items-center gap-1" style={{ color: brand.carbonMuted }}>
            <MapPin size={11} /> {chatActivo.direccion}
          </p>
        </div>
      </div>

      {error && (
        <div className="px-4 py-2 text-xs" style={{ background: brand.dangerSoft, color: brand.danger }}>
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4" style={{ background: brand.crema }}>
        {Object.entries(grupos).map(([fecha, msgs]) => (
          <div key={fecha}>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px" style={{ background: brand.border }} />
              <span className="text-xs px-2 capitalize" style={{ color: brand.carbonMuted }}>{formatFechaGrupo(fecha, wpMode)}</span>
              <div className="flex-1 h-px" style={{ background: brand.border }} />
            </div>
            <div className="space-y-2">
              {msgs.map(msg => {
                const mine = msg.autor === "profesional";
                return (
                  <div key={msg.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    {!mine && (
                      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mr-2 mt-1" style={{ background: brand.ciruelaSoft }}>
                        <User size={13} style={{ color: brand.ciruela }} />
                      </div>
                    )}
                    <div className="max-w-xs md:max-w-sm">
                      <div
                        className="rounded-2xl px-4 py-2.5 text-sm"
                        style={{
                          background: mine ? brand.ciruela : brand.cremaCard,
                          color: mine ? brand.crema : brand.carbon,
                          borderBottomRightRadius: mine ? "4px" : undefined,
                          borderBottomLeftRadius: !mine ? "4px" : undefined,
                          border: mine ? undefined : `1px solid ${brand.border}`,
                        }}
                      >
                        {msg.texto}
                      </div>
                      <div className={`flex mt-0.5 ${mine ? "justify-end" : ""}`}>
                        <span className="text-xs" style={{ color: brand.carbonMuted }}>{msg.hora}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div
        className="flex items-center gap-3 px-4 py-3 rounded-b-lg flex-shrink-0"
        style={{ background: brand.cremaCard, border: `1px solid ${brand.border}` }}
      >
        <input
          type="text"
          value={texto}
          onChange={e => setTexto(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void enviar();
            }
          }}
          placeholder="Escribe un mensaje…"
          className="flex-1 px-4 py-2 rounded-full text-sm outline-none"
          style={{ background: brand.crema, border: `1px solid ${brand.border}`, color: brand.carbon }}
        />
        <button
          onClick={() => void enviar()}
          disabled={!texto.trim() || sending}
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-40"
          style={{ background: texto.trim() ? brand.mostaza : brand.carbonFaint, color: brand.carbon }}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}

import { useState, useRef, useEffect } from "react";
import { Send, ArrowLeft, User, Users, Plus, MapPin, X, Stethoscope } from "lucide-react";
import { brand, Especialidad } from "../brand";
import { familiasDemo, equipoDemo } from "../demoData";
import {
  createChat,
  fetchChat,
  fetchChats,
  fetchFamilias,
  fetchProfesionales,
  markChatRead,
  sendChatMessage,
  TerranimaApiError,
  type ApiChat,
  type ApiFamilia,
  type ApiProfesionalEquipo,
} from "../api/terranima";
import { isWpEmbedded } from "../wpConfig";
import type { ProfChatKind, ProfFocus } from "../profNav";

interface Mensaje {
  id: string;
  texto: string;
  autor: "cliente" | "profesional";
  autorNombre?: string;
  autorEspecialidad?: string | null;
  mio?: boolean;
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
  ambito: "familia" | "animal" | "equipo";
  kind: ProfChatKind;
  animal: string | null;
  peerId?: string;
  peerNombre?: string;
  peerEspecialidad?: string;
  mensajes: Mensaje[];
  noLeidos: number;
  preview?: string;
  previewAutor?: "cliente" | "profesional" | null;
}

interface ProfesionalOption {
  id: string;
  nombre: string;
  especialidad: string;
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
  focus?: ProfFocus;
  onUnreadChange?: (n: number) => void;
}

function chatsSeed(especialidad: Especialidad, profesionalNombre: string): ChatProf[] {
  const f1 = familiasDemo[0];
  const otro = equipoDemo.find(p => p.nombre !== profesionalNombre) ?? equipoDemo[1];
  const equipo: ChatProf = {
    id: "peq",
    familiaId: f1.id,
    familiaNombre: f1.nombre,
    tutor: f1.tutor,
    direccion: f1.direccion,
    ambito: "equipo",
    kind: "equipo",
    animal: null,
    peerId: String(otro.id),
    peerNombre: otro.nombre,
    peerEspecialidad: otro.especialidad,
    noLeidos: 1,
    mensajes: [
      {
        id: "e1",
        texto: "Coordinamos el caso de Rocky: ruidos + dieta blanda. ¿Os encaja revisar juntos antes de la sesión del 22?",
        autor: "profesional",
        autorNombre: otro.nombre,
        autorEspecialidad: otro.especialidad,
        mio: false,
        hora: "10:15",
        fecha: "2026-07-26",
        leido: false,
      },
      {
        id: "e2",
        texto: "De acuerdo. Yo trabajo habituación al ruido; avisad si cambia la alimentación.",
        autor: "profesional",
        autorNombre: profesionalNombre,
        autorEspecialidad: especialidad,
        mio: true,
        hora: "10:42",
        fecha: "2026-07-26",
        leido: true,
      },
    ],
  };

  if (especialidad === "Educación canina") {
    return [
      {
        id: "p1",
        familiaId: f1.id,
        familiaNombre: f1.nombre,
        tutor: f1.tutor,
        direccion: f1.direccion,
        ambito: "familia",
        kind: "cliente",
        animal: null,
        noLeidos: 1,
        mensajes: [
          { id: "1", texto: "Rocky se pone nervioso con truenos. ¿Podéis acompañarnos?", autor: "cliente", hora: "16:20", fecha: "2026-07-24", leido: true },
          { id: "2", texto: "Claro. Empezamos por un entorno seguro y refuerzo positivo.", autor: "profesional", hora: "17:05", fecha: "2026-07-24", leido: true, mio: true },
          { id: "3", texto: "Hola María, ¿cómo estáis estos días con los ruidos?", autor: "profesional", hora: "09:30", fecha: "2026-07-27", leido: false, mio: true },
        ],
      },
      equipo,
    ];
  }
  return [
    {
      id: "p2",
      familiaId: f1.id,
      familiaNombre: f1.nombre,
      tutor: f1.tutor,
      direccion: f1.direccion,
      ambito: "familia",
      kind: "cliente",
      animal: null,
      noLeidos: 1,
      mensajes: [
        { id: "1", texto: "Tras la gastroenteritis de Rocky, mantenemos dieta blanda unos días más.", autor: "profesional", hora: "11:20", fecha: "2026-07-12", leido: true, mio: true },
        { id: "2", texto: "Propuesta de ajuste de dieta hipoalergénica para Luna.", autor: "profesional", hora: "08:45", fecha: "2026-07-27", leido: false, mio: true },
      ],
    },
    equipo,
  ];
}

function mapApiToProf(c: ApiChat): ChatProf {
  const kind: ProfChatKind = c.kind ?? (c.ambito === "equipo" ? "equipo" : "cliente");
  return {
    id: c.id,
    familiaId: String(c.familiaUserId ?? ""),
    familiaNombre: c.familiaNombre || "Familia",
    tutor: c.tutor || "",
    direccion: c.direccion || "",
    ambito: c.ambito,
    kind,
    animal: c.animal,
    peerId: c.peerUserId != null ? String(c.peerUserId) : undefined,
    peerNombre: c.peerNombre || (c.kind === "equipo" || c.ambito === "equipo" ? c.nombre : undefined),
    peerEspecialidad: c.peerEspecialidad,
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
  if (u) {
    const prefix = chat.kind === "equipo"
      ? (u.mio ? "Tú: " : (u.autorNombre ? `${u.autorNombre}: ` : ""))
      : (u.autor === "profesional" ? "Tú: " : "");
    return prefix + u.texto;
  }
  if (chat.preview) return (chat.previewAutor === "profesional" ? "Tú: " : "") + chat.preview;
  return "Sin mensajes";
}

function isMine(msg: Mensaje, kind: ProfChatKind) {
  if (typeof msg.mio === "boolean") return msg.mio;
  if (kind === "equipo") return false;
  return msg.autor === "profesional";
}

export function ProfChatPage({ especialidad, profesionalNombre, focus, onUnreadChange }: ProfChatPageProps) {
  const wpMode = isWpEmbedded();
  const [chats, setChats] = useState<ChatProf[]>(() => (wpMode ? [] : chatsSeed(especialidad, profesionalNombre)));
  const [familias, setFamilias] = useState<FamiliaOption[]>(
    () => (wpMode ? [] : familiasDemo.map(f => ({
      id: f.id,
      nombre: f.nombre,
      tutor: f.tutor,
      direccion: f.direccion,
      animales: f.animales,
    })))
  );
  const [profesionales, setProfesionales] = useState<ProfesionalOption[]>(() =>
    wpMode
      ? []
      : equipoDemo
          .filter(p => p.nombre !== profesionalNombre)
          .map(p => ({ id: String(p.id), nombre: p.nombre, especialidad: p.especialidad }))
  );
  const [chatActivoId, setChatActivoId] = useState<string | null>(null);
  const [texto, setTexto] = useState("");
  const [nuevoOpen, setNuevoOpen] = useState(!!focus?.openCreate && focus?.chatKind === "equipo");
  const [tab, setTab] = useState<ProfChatKind>(focus?.chatKind ?? "cliente");
  const [familiaId, setFamiliaId] = useState(focus?.familiaId ?? "");
  const [peerId, setPeerId] = useState("");
  const [loading, setLoading] = useState(wpMode);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const focusKey = useRef("");

  const chatActivo = chats.find(c => c.id === chatActivoId) ?? null;
  const familiaForm = familias.find(f => f.id === familiaId) ?? familias[0];
  const visibles = chats.filter(c => c.kind === tab);
  const unreadTotal = chats.reduce((n, c) => n + (c.noLeidos || 0), 0);
  const peerForm = profesionales.find(p => p.id === peerId) ?? profesionales[0];
  const casoContexto = familiaId ? familias.find(f => f.id === familiaId) : undefined;

  useEffect(() => {
    onUnreadChange?.(unreadTotal);
  }, [unreadTotal, onUnreadChange]);

  useEffect(() => {
    if (!wpMode) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetchChats(),
      fetchFamilias(),
      fetchProfesionales().catch(() => [] as ApiProfesionalEquipo[]),
    ])
      .then(([chatList, famList, profList]) => {
        if (cancelled) return;
        const mappedFam = famList.map(mapFamilia);
        setFamilias(mappedFam);
        if (mappedFam[0] && !familiaId) {
          setFamiliaId(mappedFam[0].id);
        }
        const fromRoute = (profList as ApiProfesionalEquipo[]).map(p => ({
          id: String(p.id),
          nombre: p.nombre,
          especialidad: p.especialidad,
        }));
        const fromFamilias: ProfesionalOption[] = [];
        for (const f of famList) {
          for (const p of f.equipo ?? []) {
            if (!fromFamilias.some(x => x.id === String(p.id))) {
              fromFamilias.push({ id: String(p.id), nombre: p.nombre, especialidad: p.especialidad });
            }
          }
        }
        const mappedProf = (fromRoute.length ? fromRoute : fromFamilias);
        setProfesionales(mappedProf);
        if (mappedProf[0] && !peerId) setPeerId(mappedProf[0].id);
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
    }
    if (!peerId && profesionales[0]) setPeerId(profesionales[0].id);
  }, [wpMode, familiaId, familias, peerId, profesionales]);

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

  const crearChatCon = async (kind: ProfChatKind, famId: string, peerOverride?: string) => {
    if (kind === "equipo") {
      const peer = profesionales.find(p => p.id === (peerOverride || peerId)) ?? profesionales[0];
      if (!peer) return;
      const existe = chats.find(c => c.kind === "equipo" && c.peerId === peer.id);
      if (existe) {
        setNuevoOpen(false);
        await abrirChat(existe.id);
        return;
      }
      if (wpMode) {
        setError("");
        try {
          const created = await createChat({
            familiaUserId: famId && Number(famId) ? Number(famId) : undefined,
            ambito: "equipo",
            kind: "equipo",
            peerUserId: Number(peer.id) || peer.id,
          });
          const mapped = mapApiToProf(created);
          setChats(prev => {
            const found = prev.find(c => c.id === mapped.id);
            return found ? prev.map(c => (c.id === mapped.id ? mapped : c)) : [mapped, ...prev];
          });
          setNuevoOpen(false);
          await abrirChat(mapped.id);
        } catch (err) {
          setError(err instanceof TerranimaApiError ? err.message : "No se pudo crear el chat interno.");
        }
        return;
      }
      const fam = famId ? familias.find(f => f.id === famId) : undefined;
      const nuevo: ChatProf = {
        id: String(Date.now()),
        familiaId: fam?.id ?? "",
        familiaNombre: fam?.nombre ?? "",
        tutor: fam?.tutor ?? "",
        direccion: fam?.direccion ?? "",
        ambito: "equipo",
        kind: "equipo",
        animal: null,
        peerId: peer.id,
        peerNombre: peer.nombre,
        peerEspecialidad: peer.especialidad,
        noLeidos: 0,
        mensajes: [],
      };
      setChats(prev => [nuevo, ...prev]);
      setNuevoOpen(false);
      await abrirChat(nuevo.id);
      return;
    }

    const fam = familias.find(f => f.id === famId);
    if (!fam) return;

    const existe = chats.find(c => c.familiaId === fam.id && c.kind === "cliente");
    if (existe) {
      setNuevoOpen(false);
      await abrirChat(existe.id);
      return;
    }

    if (wpMode) {
      setError("");
      try {
        const created = await createChat({
          familiaUserId: Number(fam.id),
          ambito: "familia",
        });
        const mapped = mapApiToProf(created);
        setChats(prev => {
          const found = prev.find(c => c.id === mapped.id);
          return found ? prev.map(c => (c.id === mapped.id ? mapped : c)) : [mapped, ...prev];
        });
        setNuevoOpen(false);
        await abrirChat(mapped.id);
      } catch (err) {
        setError(err instanceof TerranimaApiError ? err.message : "No se pudo crear el chat.");
      }
      return;
    }

    const nuevo: ChatProf = {
      id: String(Date.now()),
      familiaId: fam.id,
      familiaNombre: fam.nombre,
      tutor: fam.tutor,
      direccion: fam.direccion,
      ambito: "familia",
      kind: "cliente",
      animal: null,
      noLeidos: 0,
      mensajes: [],
    };
    setChats(prev => [nuevo, ...prev]);
    setNuevoOpen(false);
    await abrirChat(nuevo.id);
  };

  const crearChat = async () => {
    if (tab === "equipo") {
      await crearChatCon("equipo", familiaId);
      return;
    }
    const fam = familias.find(f => f.id === familiaId);
    if (!fam) return;
    await crearChatCon("cliente", fam.id);
  };

  useEffect(() => {
    if (loading) return;
    const kind = focus?.chatKind;
    if (!kind && !focus?.openCreate) return;
    const key = `${focus?.familiaId ?? ""}:${kind ?? ""}:${focus?.openCreate ? "1" : "0"}`;
    if (focusKey.current === key) return;
    focusKey.current = key;

    if (kind === "equipo" || (focus?.openCreate && kind === "equipo")) {
      setTab("equipo");
      if (focus?.familiaId) setFamiliaId(focus.familiaId);
      setNuevoOpen(true);
      return;
    }

    if (kind === "cliente" && focus?.familiaId) {
      if (familias.length === 0) {
        focusKey.current = "";
        return;
      }
      setTab("cliente");
      setFamiliaId(focus.familiaId);
      void crearChatCon("cliente", focus.familiaId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus, loading, familias]);

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
      autorNombre: profesionalNombre,
      autorEspecialidad: especialidad,
      mio: true,
      hora: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
      fecha: "2026-07-27",
      leido: true,
    };
    setChats(prev =>
      prev.map(c => (c.id === chatActivoId ? { ...c, mensajes: [...c.mensajes, nuevo] } : c))
    );
    setTexto("");
  };

  const tituloChat = (chat: ChatProf) => {
    if (chat.kind === "equipo") return chat.peerNombre || "Profesional";
    return chat.familiaNombre;
  };

  const iconoChat = (chat: ChatProf) => {
    if (chat.kind === "equipo") return <Stethoscope size={18} style={{ color: brand.azulNoche }} />;
    return <Users size={18} style={{ color: brand.carbon }} />;
  };

  const fondoIcono = (chat: ChatProf) => {
    if (chat.kind === "equipo") return brand.azulNocheSoft;
    return brand.mostazaSoft;
  };

  if (!chatActivo) {
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold" style={{ color: brand.ciruela }}>Chats</h1>
            <p className="text-sm mt-1" style={{ color: brand.carbonMuted }}>
              {profesionalNombre} · {especialidad}
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

        <div
          className="flex gap-0"
          style={{ background: brand.cremaCard, border: `1px solid ${brand.border}`, borderRadius: "0.375rem", padding: "3px" }}
        >
          {([
            { id: "cliente" as const, label: "Con familias" },
            { id: "equipo" as const, label: "Interno" },
          ]).map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className="flex-1 py-2 text-sm font-medium rounded transition-all"
              style={{
                background: tab === t.id ? brand.mostaza : "transparent",
                color: tab === t.id ? brand.carbon : brand.carbonMuted,
              }}
            >
              {t.label}
              {chats.filter(c => c.kind === t.id && c.noLeidos > 0).length > 0 ? (
                <span className="ml-1.5 text-xs">({chats.filter(c => c.kind === t.id && c.noLeidos > 0).length})</span>
              ) : null}
            </button>
          ))}
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
          ) : visibles.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm" style={{ color: brand.carbonMuted }}>
                {tab === "equipo"
                  ? "Aún no hay chats internos. Crea una conversación con otro profesional."
                  : "Aún no hay chats. Crea el primero."}
              </p>
            </div>
          ) : (
            visibles.map((chat, index) => (
              <button
                key={chat.id}
                onClick={() => void abrirChat(chat.id)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all"
                style={{ borderBottom: index < visibles.length - 1 ? `1px solid ${brand.border}` : undefined }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = brand.crema}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
              >
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: fondoIcono(chat) }}
                >
                  {iconoChat(chat)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: brand.carbon }}>
                    {tituloChat(chat)}
                  </p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: brand.carbonMuted }}>
                    {chat.kind === "equipo"
                      ? [chat.peerEspecialidad, chat.familiaNombre ? `Sobre ${chat.familiaNombre}` : "Chat interno"].filter(Boolean).join(" · ")
                      : chat.tutor}
                  </p>
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
                  {tab === "equipo" ? "Nueva conversación interna" : "Nuevo chat"}
                </h3>
                <button type="button" onClick={() => setNuevoOpen(false)} style={{ color: brand.carbonMuted }}>
                  <X size={18} />
                </button>
              </div>
              {tab === "equipo" ? (
                <>
                  <p className="text-xs" style={{ color: brand.carbonMuted }}>
                    Elige con qué profesional hablar. La familia no verá este hilo.
                  </p>
                  {casoContexto && (
                    <p className="text-xs px-3 py-2 rounded" style={{ background: brand.azulNocheSoft, color: brand.azulNoche }}>
                      Contexto del caso: {casoContexto.nombre}
                    </p>
                  )}
                  {profesionales.length === 0 ? (
                    <p className="text-sm" style={{ color: brand.carbonMuted }}>No hay otros profesionales disponibles.</p>
                  ) : (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium" style={{ color: brand.carbon }}>Profesional</label>
                        <select
                          value={peerId}
                          onChange={e => setPeerId(e.target.value)}
                          className="w-full px-3 py-2 rounded text-sm outline-none"
                          style={{ background: brand.crema, border: `1px solid ${brand.borderStrong}`, color: brand.carbon }}
                        >
                          {profesionales.map(p => (
                            <option key={p.id} value={p.id}>{p.nombre} — {p.especialidad}</option>
                          ))}
                        </select>
                        {peerForm && (
                          <p className="text-xs" style={{ color: brand.carbonMuted }}>
                            {peerForm.especialidad}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => void crearChat()}
                        className="w-full py-2.5 rounded text-sm font-semibold"
                        style={{ background: brand.mostaza, color: brand.carbon }}
                      >
                        Abrir conversación
                      </button>
                    </>
                  )}
                </>
              ) : (
                <>
                  <p className="text-xs" style={{ color: brand.carbonMuted }}>
                    El chat es con el cliente asignado, para todos sus animales.
                  </p>
                  {familias.length === 0 ? (
                    <p className="text-sm" style={{ color: brand.carbonMuted }}>No hay familias disponibles.</p>
                  ) : (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium" style={{ color: brand.carbon }}>Familia / tutor</label>
                        <select
                          value={familiaId}
                          onChange={e => setFamiliaId(e.target.value)}
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
          style={{ background: fondoIcono(chatActivo) }}
        >
          {iconoChat(chatActivo)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display text-sm font-semibold truncate" style={{ color: brand.ciruela }}>
            {tituloChat(chatActivo)}
          </p>
          <p className="text-xs truncate flex items-center gap-1" style={{ color: brand.carbonMuted }}>
            {chatActivo.kind === "equipo"
              ? [chatActivo.peerEspecialidad, "La familia no ve este hilo"].filter(Boolean).join(" · ")
              : <><MapPin size={11} /> {chatActivo.direccion}</>}
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
                const mine = isMine(msg, chatActivo.kind);
                return (
                  <div key={msg.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    {!mine && (
                      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mr-2 mt-1" style={{ background: chatActivo.kind === "equipo" ? brand.azulNocheSoft : brand.ciruelaSoft }}>
                        {chatActivo.kind === "equipo"
                          ? <Stethoscope size={13} style={{ color: brand.azulNoche }} />
                          : <User size={13} style={{ color: brand.ciruela }} />}
                      </div>
                    )}
                    <div className="max-w-xs md:max-w-sm">
                      {!mine && chatActivo.kind === "equipo" && msg.autorNombre && (
                        <p className="text-xs mb-0.5 px-1" style={{ color: brand.azulNoche }}>
                          {msg.autorNombre}{msg.autorEspecialidad ? ` · ${msg.autorEspecialidad}` : ""}
                        </p>
                      )}
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
          placeholder={chatActivo.kind === "equipo" ? `Escribe a ${chatActivo.peerNombre || "tu compañero/a"}…` : "Escribe un mensaje…"}
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

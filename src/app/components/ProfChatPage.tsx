import { useState, useRef, useEffect } from "react";
import { Send, ArrowLeft, User, Heart, Users, Plus, MapPin, X } from "lucide-react";
import { brand, Especialidad } from "../brand";
import { familiasDemo } from "../demoData";

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

function agruparPorFecha(mensajes: Mensaje[]) {
  const grupos: Record<string, Mensaje[]> = {};
  mensajes.forEach(m => {
    if (!grupos[m.fecha]) grupos[m.fecha] = [];
    grupos[m.fecha].push(m);
  });
  return grupos;
}

function formatFechaGrupo(dateStr: string) {
  if (dateStr === "2026-07-27") return "Hoy";
  if (dateStr === "2026-07-26") return "Ayer";
  return new Date(dateStr + "T12:00:00").toLocaleDateString("es-ES", {
    weekday: "long", day: "numeric", month: "long",
  });
}

function preview(chat: ChatProf) {
  const u = chat.mensajes[chat.mensajes.length - 1];
  if (!u) return "Sin mensajes";
  return (u.autor === "profesional" ? "Tú: " : "") + u.texto;
}

export function ProfChatPage({ especialidad, profesionalNombre }: ProfChatPageProps) {
  const [chats, setChats] = useState(() => chatsSeed(especialidad));
  const [chatActivoId, setChatActivoId] = useState<string | null>(null);
  const [texto, setTexto] = useState("");
  const [nuevoOpen, setNuevoOpen] = useState(false);
  const [familiaId, setFamiliaId] = useState(familiasDemo[0].id);
  const [animalId, setAnimalId] = useState(familiasDemo[0].animales[0]?.id ?? "");
  const bottomRef = useRef<HTMLDivElement>(null);

  const esEducacion = especialidad === "Educación canina";
  const chatActivo = chats.find(c => c.id === chatActivoId) ?? null;
  const familiaForm = familiasDemo.find(f => f.id === familiaId) ?? familiasDemo[0];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatActivo?.mensajes]);

  const abrirChat = (id: string) => {
    setChatActivoId(id);
    setTexto("");
    setChats(prev =>
      prev.map(c =>
        c.id === id ? { ...c, noLeidos: 0, mensajes: c.mensajes.map(m => ({ ...m, leido: true })) } : c
      )
    );
  };

  const crearChat = () => {
    const fam = familiasDemo.find(f => f.id === familiaId)!;
    if (esEducacion) {
      const existe = chats.find(c => c.familiaId === fam.id && c.ambito === "familia");
      if (existe) {
        setNuevoOpen(false);
        abrirChat(existe.id);
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
      abrirChat(nuevo.id);
      return;
    }

    const animal = fam.animales.find(a => a.id === animalId) ?? fam.animales[0];
    if (!animal) return;
    const existe = chats.find(c => c.familiaId === fam.id && c.animal === animal.nombre);
    if (existe) {
      setNuevoOpen(false);
      abrirChat(existe.id);
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
    abrirChat(nuevo.id);
  };

  const enviar = () => {
    const t = texto.trim();
    if (!t || !chatActivoId) return;
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

        <div className="rounded-lg overflow-hidden" style={{ background: brand.cremaCard, border: `1px solid ${brand.border}` }}>
          {chats.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm" style={{ color: brand.carbonMuted }}>Aún no hay chats. Crea el primero.</p>
            </div>
          ) : (
            chats.map((chat, index) => (
              <button
                key={chat.id}
                onClick={() => abrirChat(chat.id)}
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
              <div className="space-y-1.5">
                <label className="text-xs font-medium" style={{ color: brand.carbon }}>Familia / tutor</label>
                <select
                  value={familiaId}
                  onChange={e => {
                    const id = e.target.value;
                    setFamiliaId(id);
                    const fam = familiasDemo.find(f => f.id === id)!;
                    setAnimalId(fam.animales[0]?.id ?? "");
                  }}
                  className="w-full px-3 py-2 rounded text-sm outline-none"
                  style={{ background: brand.crema, border: `1px solid ${brand.borderStrong}`, color: brand.carbon }}
                >
                  {familiasDemo.map(f => (
                    <option key={f.id} value={f.id}>{f.nombre} — {f.tutor}</option>
                  ))}
                </select>
                <p className="text-xs flex items-start gap-1" style={{ color: brand.carbonMuted }}>
                  <MapPin size={12} className="mt-0.5 flex-shrink-0" /> {familiaForm.direccion}
                </p>
              </div>
              {!esEducacion && (
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
                onClick={crearChat}
                className="w-full py-2.5 rounded text-sm font-semibold"
                style={{ background: brand.mostaza, color: brand.carbon }}
              >
                Abrir chat
              </button>
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

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4" style={{ background: brand.crema }}>
        {Object.entries(grupos).map(([fecha, msgs]) => (
          <div key={fecha}>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px" style={{ background: brand.border }} />
              <span className="text-xs px-2 capitalize" style={{ color: brand.carbonMuted }}>{formatFechaGrupo(fecha)}</span>
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
              enviar();
            }
          }}
          placeholder="Escribe un mensaje…"
          className="flex-1 px-4 py-2 rounded-full text-sm outline-none"
          style={{ background: brand.crema, border: `1px solid ${brand.border}`, color: brand.carbon }}
        />
        <button
          onClick={enviar}
          disabled={!texto.trim()}
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-40"
          style={{ background: texto.trim() ? brand.mostaza : brand.carbonFaint, color: brand.carbon }}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}

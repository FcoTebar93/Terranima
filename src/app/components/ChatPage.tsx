import { useState, useRef, useEffect } from "react";
import { Send, ArrowLeft, User, Heart, Users } from "lucide-react";
import { brand } from "../brand";

interface Mensaje {
  id: string;
  texto: string;
  autor: "cliente" | "profesional";
  hora: string;
  fecha: string;
  leido: boolean;
}

type AmbitoChat = "familia" | "animal";

interface Chat {
  id: string;
  /** Especialidad / rol del profesional */
  nombre: string;
  subtitulo: string;
  ambito: AmbitoChat;
  /** Nombre del animal si ambito === animal; null si es por familia */
  animal: string | null;
  mensajes: Mensaje[];
  noLeidos: number;
  enLinea: boolean;
}

/**
 * Educación canina → chat por familia (terapia conjunta).
 * Nutrición → chat por animal.
 */
const chatsIniciales: Chat[] = [
  {
    id: "1",
    nombre: "Educación canina",
    subtitulo: "Chat familiar",
    ambito: "familia",
    animal: null,
    enLinea: true,
    noLeidos: 1,
    mensajes: [
      { id: "1", texto: "Rocky se pone nervioso con truenos. ¿Podéis acompañarnos con alguna pauta respetuosa para toda la familia?", autor: "cliente", hora: "16:20", fecha: "2026-07-24", leido: true },
      { id: "2", texto: "Claro. Empezamos por un entorno seguro y refuerzo positivo; sin corrección punitiva. Te propongo una sesión el 22 de agosto.", autor: "profesional", hora: "17:05", fecha: "2026-07-24", leido: true },
      { id: "3", texto: "Perfecto, la pedimos desde el portal. Gracias.", autor: "cliente", hora: "17:40", fecha: "2026-07-24", leido: true },
      { id: "4", texto: "Hola María, ¿cómo estáis estos días con los ruidos en casa?", autor: "profesional", hora: "09:30", fecha: "2026-07-27", leido: false },
    ],
  },
  {
    id: "2",
    nombre: "Nutrición",
    subtitulo: "Luna",
    ambito: "animal",
    animal: "Luna",
    enLinea: true,
    noLeidos: 1,
    mensajes: [
      { id: "1", texto: "Hola María. Revisando las notas de Luna, te proponemos ajustar la dieta hipoalergénica. ¿Te va bien hablarlo el 3 de septiembre?", autor: "profesional", hora: "08:45", fecha: "2026-07-27", leido: false },
    ],
  },
  {
    id: "3",
    nombre: "Nutrición",
    subtitulo: "Rocky",
    ambito: "animal",
    animal: "Rocky",
    enLinea: false,
    noLeidos: 0,
    mensajes: [
      { id: "1", texto: "Tras la gastroenteritis de Rocky, mantenemos la transición a dieta blanda unos días más. Cualquier cambio, avísanos.", autor: "profesional", hora: "11:20", fecha: "2026-07-12", leido: true },
      { id: "2", texto: "De acuerdo, gracias. Va comiendo mejor.", autor: "cliente", hora: "12:05", fecha: "2026-07-12", leido: true },
    ],
  },
];

function agruparPorFecha(mensajes: Mensaje[]) {
  const grupos: Record<string, Mensaje[]> = {};
  mensajes.forEach(m => {
    if (!grupos[m.fecha]) grupos[m.fecha] = [];
    grupos[m.fecha].push(m);
  });
  return grupos;
}

function formatFechaGrupo(dateStr: string) {
  const hoy = "2026-07-27";
  const ayer = "2026-07-26";
  if (dateStr === hoy) return "Hoy";
  if (dateStr === ayer) return "Ayer";
  return new Date(dateStr + "T12:00:00").toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function previewUltimoMensaje(chat: Chat) {
  const ultimo = chat.mensajes[chat.mensajes.length - 1];
  if (!ultimo) return "Sin mensajes";
  const prefijo = ultimo.autor === "cliente" ? "Tú: " : "";
  return prefijo + ultimo.texto;
}

function horaUltimoMensaje(chat: Chat) {
  const ultimo = chat.mensajes[chat.mensajes.length - 1];
  if (!ultimo) return "";
  if (ultimo.fecha === "2026-07-27") return ultimo.hora;
  return new Date(ultimo.fecha + "T12:00:00").toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
  });
}

export function ChatPage() {
  const [chats, setChats] = useState(chatsIniciales);
  const [chatActivoId, setChatActivoId] = useState<string | null>(null);
  const [texto, setTexto] = useState("");
  const [escribiendo, setEscribiendo] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const chatActivo = chats.find(c => c.id === chatActivoId) ?? null;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatActivo?.mensajes, escribiendo]);

  const abrirChat = (id: string) => {
    setChatActivoId(id);
    setTexto("");
    setEscribiendo(false);
    setChats(prev =>
      prev.map(c =>
        c.id === id
          ? { ...c, noLeidos: 0, mensajes: c.mensajes.map(m => ({ ...m, leido: true })) }
          : c
      )
    );
  };

  const enviar = () => {
    const t = texto.trim();
    if (!t || !chatActivoId) return;
    const nuevo: Mensaje = {
      id: String(Date.now()),
      texto: t,
      autor: "cliente",
      hora: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
      fecha: "2026-07-27",
      leido: true,
    };
    setChats(prev =>
      prev.map(c => (c.id === chatActivoId ? { ...c, mensajes: [...c.mensajes, nuevo] } : c))
    );
    setTexto("");

    setTimeout(() => setEscribiendo(true), 800);
    setTimeout(() => {
      setEscribiendo(false);
      const respuestas = [
        "Gracias por escribirnos. Te respondemos en cuanto podamos.",
        "Queda anotado. Cualquier duda, aquí estamos.",
        "Perfecto, lo tenemos en cuenta. Cuidaros.",
        "De acuerdo. Seguimos acompañándoos.",
      ];
      const respuesta: Mensaje = {
        id: String(Date.now() + 1),
        texto: respuestas[Math.floor(Math.random() * respuestas.length)],
        autor: "profesional",
        hora: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
        fecha: "2026-07-27",
        leido: false,
      };
      setChats(prev =>
        prev.map(c => (c.id === chatActivoId ? { ...c, mensajes: [...c.mensajes, respuesta] } : c))
      );
    }, 2500);
  };

  if (!chatActivo) {
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <div>
          <h1 className="font-display text-2xl font-semibold" style={{ color: brand.ciruela }}>
            Chats
          </h1>
          <p className="text-sm mt-1" style={{ color: brand.carbonMuted }}>
            Habla con tu equipo cooperativo cuando lo necesitéis
          </p>
        </div>

        <div
          className="rounded-lg overflow-hidden"
          style={{ background: brand.cremaCard, border: `1px solid ${brand.border}` }}
        >
          {chats.map((chat, index) => (
            <button
              key={chat.id}
              onClick={() => abrirChat(chat.id)}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all"
              style={{
                borderBottom: index < chats.length - 1 ? `1px solid ${brand.border}` : undefined,
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = brand.crema}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
            >
              <div className="relative flex-shrink-0">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center"
                  style={{ background: chat.ambito === "familia" ? brand.mostazaSoft : brand.ciruelaSoft }}
                >
                  {chat.ambito === "familia" ? (
                    <Users size={18} style={{ color: brand.carbon }} />
                  ) : (
                    <Heart size={18} style={{ color: brand.ciruela }} />
                  )}
                </div>
                {chat.enLinea && (
                  <div
                    className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
                    style={{ background: brand.mostaza, borderColor: brand.cremaCard }}
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold truncate" style={{ color: brand.carbon }}>
                    {chat.nombre}
                  </p>
                  <span className="text-xs flex-shrink-0" style={{ color: brand.carbonMuted }}>
                    {horaUltimoMensaje(chat)}
                  </span>
                </div>
                <p className="text-xs mt-0.5 truncate" style={{ color: brand.carbonMuted }}>
                  {chat.ambito === "familia" ? "Familia García López" : chat.subtitulo}
                </p>
                <p
                  className="text-xs mt-1 truncate"
                  style={{
                    color: chat.noLeidos > 0 ? brand.carbon : brand.carbonMuted,
                    fontWeight: chat.noLeidos > 0 ? 500 : 400,
                  }}
                >
                  {previewUltimoMensaje(chat)}
                </p>
              </div>
              {chat.noLeidos > 0 && (
                <span
                  className="w-5 h-5 rounded-full text-xs flex items-center justify-center font-semibold flex-shrink-0"
                  style={{ background: brand.mostaza, color: brand.carbon }}
                >
                  {chat.noLeidos}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const grupos = agruparPorFecha(chatActivo.mensajes);

  return (
    <div className="max-w-2xl mx-auto flex flex-col" style={{ height: "calc(100dvh - 7.5rem)" }}>
      <div
        className="flex items-center gap-3 px-4 py-3.5 rounded-t-lg flex-shrink-0"
        style={{ background: brand.cremaCard, borderBottom: `1px solid ${brand.border}`, border: `1px solid ${brand.border}`, borderBottomWidth: 1 }}
      >
        <button
          onClick={() => setChatActivoId(null)}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-colors flex-shrink-0"
          style={{ color: brand.carbonMuted }}
          title="Volver a chats"
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = brand.crema}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
        >
          <ArrowLeft size={16} />
        </button>
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: chatActivo.ambito === "familia" ? brand.mostazaSoft : brand.ciruelaSoft }}
        >
          {chatActivo.ambito === "familia" ? (
            <Users size={17} style={{ color: brand.carbon }} />
          ) : (
            <Heart size={17} style={{ color: brand.ciruela }} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display text-sm font-semibold truncate" style={{ color: brand.ciruela }}>
            {chatActivo.nombre}
          </p>
          <div className="flex items-center gap-1.5">
            {chatActivo.enLinea ? (
              <>
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: brand.mostaza }} />
                <span className="text-xs" style={{ color: brand.carbonMuted }}>
                  {chatActivo.ambito === "familia"
                    ? "Familia · Disponible ahora"
                    : `${chatActivo.animal} · Disponible ahora`}
                </span>
              </>
            ) : (
              <span className="text-xs truncate" style={{ color: brand.carbonMuted }}>
                {chatActivo.ambito === "familia" ? "Familia García López" : chatActivo.subtitulo}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4" style={{ background: brand.crema }}>
        {Object.entries(grupos).map(([fecha, msgs]) => (
          <div key={fecha}>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px" style={{ background: brand.border }} />
              <span className="text-xs px-2 capitalize" style={{ color: brand.carbonMuted }}>
                {formatFechaGrupo(fecha)}
              </span>
              <div className="flex-1 h-px" style={{ background: brand.border }} />
            </div>
            <div className="space-y-2">
              {msgs.map(msg => {
                const isClient = msg.autor === "cliente";
                return (
                  <div key={msg.id} className={`flex ${isClient ? "justify-end" : "justify-start"}`}>
                    {!isClient && (
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mr-2 mt-1"
                        style={{ background: brand.ciruelaSoft }}
                      >
                        <User size={13} style={{ color: brand.ciruela }} />
                      </div>
                    )}
                    <div className="max-w-xs md:max-w-sm">
                      <div
                        className="rounded-2xl px-4 py-2.5 text-sm"
                        style={{
                          background: isClient ? brand.ciruela : brand.cremaCard,
                          color: isClient ? brand.crema : brand.carbon,
                          borderBottomRightRadius: isClient ? "4px" : undefined,
                          borderBottomLeftRadius: !isClient ? "4px" : undefined,
                          border: isClient ? undefined : `1px solid ${brand.border}`,
                        }}
                      >
                        {msg.texto}
                      </div>
                      <div className={`flex items-center gap-1 mt-0.5 ${isClient ? "justify-end" : ""}`}>
                        <span className="text-xs" style={{ color: brand.carbonMuted }}>{msg.hora}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {escribiendo && (
          <div className="flex justify-start items-end gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: brand.ciruelaSoft }}
            >
              <User size={13} style={{ color: brand.ciruela }} />
            </div>
            <div
              className="rounded-2xl px-4 py-3 rounded-bl-sm"
              style={{ background: brand.cremaCard, border: `1px solid ${brand.border}` }}
            >
              <div className="flex items-center gap-1">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{ background: brand.carbonFaint, animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div
        className="flex items-center gap-3 px-4 py-3 rounded-b-lg flex-shrink-0"
        style={{ background: brand.cremaCard, border: `1px solid ${brand.border}`, borderTopWidth: 1 }}
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
          style={{
            background: brand.crema,
            border: `1px solid ${brand.border}`,
            color: brand.carbon,
          }}
        />
        <button
          onClick={enviar}
          disabled={!texto.trim()}
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40"
          style={{
            background: texto.trim() ? brand.mostaza : brand.carbonFaint,
            color: brand.carbon,
          }}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}

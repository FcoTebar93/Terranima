import { useEffect, useRef } from "react";
import { fetchChatMessages, type ApiMensaje } from "./api/terranima";

/**
 * Mientras el hilo está abierto, pregunta al servidor cada pocos segundos.
 * WordPress no trae websocket; el intervalo cubre el “en vivo” del portal.
 */
export function useLiveChatMessages(
  chatId: string | null,
  enabled: boolean,
  onMessages: (chatId: string, messages: ApiMensaje[]) => void,
  paused = false,
  intervalMs = 2500,
) {
  const onMessagesRef = useRef(onMessages);
  onMessagesRef.current = onMessages;
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  useEffect(() => {
    if (!enabled || !chatId) return;

    let cancelled = false;

    const tick = async () => {
      if (cancelled || document.hidden || pausedRef.current) return;
      try {
        const msgs = await fetchChatMessages(chatId);
        if (cancelled) return;
        onMessagesRef.current(chatId, msgs);
      } catch {
        /* el siguiente ciclo reintenta */
      }
    };

    void tick();
    const id = window.setInterval(() => void tick(), intervalMs);
    const onVis = () => {
      if (!document.hidden) void tick();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelled = true;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [enabled, chatId, intervalMs]);
}

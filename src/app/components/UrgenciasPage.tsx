import { useEffect, useState } from "react";
import { AlertTriangle, Check, Send } from "lucide-react";
import { toast } from "sonner";
import { brand } from "../brand";
import {
  ApiProfesionalEquipo,
  enviarUrgencia,
  fetchProfesionales,
  TerranimaApiError,
} from "../api/terranima";
import { isWpEmbedded } from "../wpConfig";

const MENSAJE_OK =
  "En cuanto tengamos tiempo un profesional te atenderá";

export function UrgenciasPage() {
  const [profesionales, setProfesionales] = useState<ApiProfesionalEquipo[]>([]);
  const [cargandoProf, setCargandoProf] = useState(true);
  const [profesionalId, setProfesionalId] = useState("");
  const [urgencia, setUrgencia] = useState("");
  const [cuerpo, setCuerpo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setCargandoProf(true);
      try {
        if (!isWpEmbedded()) {
          if (!cancelled) {
            setProfesionales([]);
            toast.error("Las urgencias solo están disponibles en el portal WordPress.");
          }
          return;
        }
        const list = await fetchProfesionales();
        if (!cancelled) setProfesionales(list);
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof TerranimaApiError
              ? err.message
              : "No se pudieron cargar los profesionales.";
          toast.error(message);
          setProfesionales([]);
        }
      } finally {
        if (!cancelled) setCargandoProf(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const canSend =
    Boolean(profesionalId && urgencia.trim() && cuerpo.trim())
    && !enviando
    && !cargandoProf
    && isWpEmbedded();

  const resetForm = () => {
    setProfesionalId("");
    setUrgencia("");
    setCuerpo("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = Number(profesionalId);
    const tipo = urgencia.trim();
    const mensaje = cuerpo.trim();
    if (!id || !tipo || !mensaje || enviando || !isWpEmbedded()) return;

    setEnviando(true);
    try {
      await enviarUrgencia(id, tipo, mensaje);
      resetForm();
      setEnviado(true);
      toast.success(MENSAJE_OK);
      window.setTimeout(() => setEnviado(false), 4000);
    } catch (err) {
      const message =
        err instanceof TerranimaApiError
          ? err.message
          : "No se pudo enviar el aviso. Inténtalo de nuevo.";
      toast.error(message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold" style={{ color: brand.ciruela }}>
          Urgencias
        </h1>
        <p className="text-sm mt-1" style={{ color: brand.carbonMuted }}>
          Avisa al profesional que necesitéis cuando haya una urgencia
        </p>
      </div>

      <div className="rounded-lg" style={{ background: brand.cremaCard, border: `1px solid ${brand.border}` }}>
        <div className="px-5 py-4 flex items-start gap-3" style={{ borderBottom: `1px solid ${brand.border}` }}>
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ background: brand.dangerSoft }}
          >
            <AlertTriangle size={18} style={{ color: brand.danger }} />
          </div>
          <div>
            <h3 className="font-display text-base font-semibold" style={{ color: brand.ciruela }}>
              Enviar aviso
            </h3>
            <p className="text-xs mt-0.5" style={{ color: brand.carbonMuted }}>
              Elige profesional, indica el tipo de urgencia y describe qué está pasando
            </p>
          </div>
        </div>

        {enviado ? (
          <div className="p-8 flex flex-col items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: brand.successSoft }}
            >
              <Check size={24} style={{ color: brand.success }} />
            </div>
            <p className="text-sm font-semibold text-center" style={{ color: brand.carbon }}>
              Aviso enviado
            </p>
            <p className="text-xs text-center max-w-sm" style={{ color: brand.carbonMuted }}>
              {MENSAJE_OK}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="urgencia-profesional" className="text-xs font-medium" style={{ color: brand.carbon }}>
                Profesional
              </label>
              <select
                id="urgencia-profesional"
                value={profesionalId}
                onChange={e => setProfesionalId(e.target.value)}
                required
                disabled={enviando || cargandoProf}
                className="w-full px-3 py-2 rounded text-sm outline-none disabled:opacity-60"
                style={{ background: brand.crema, border: `1px solid ${brand.borderStrong}`, color: brand.carbon }}
              >
                <option value="">
                  {cargandoProf ? "Cargando…" : "Seleccionar…"}
                </option>
                {profesionales.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} · {p.especialidad}
                  </option>
                ))}
              </select>
              {!cargandoProf && profesionales.length === 0 && (
                <p className="text-xs" style={{ color: brand.danger }}>
                  No hay profesionales disponibles.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="urgencia-tipo" className="text-xs font-medium" style={{ color: brand.carbon }}>
                Tipo de urgencia
              </label>
              <input
                id="urgencia-tipo"
                type="text"
                value={urgencia}
                onChange={e => setUrgencia(e.target.value)}
                required
                maxLength={120}
                disabled={enviando}
                placeholder="Ej. comportamiento, salud, animal extraviado…"
                className="w-full px-3 py-2 rounded text-sm outline-none disabled:opacity-60"
                style={{ background: brand.crema, border: `1px solid ${brand.borderStrong}`, color: brand.carbon }}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="urgencia-cuerpo" className="text-xs font-medium" style={{ color: brand.carbon }}>
                Describe la urgencia
              </label>
              <textarea
                id="urgencia-cuerpo"
                value={cuerpo}
                onChange={e => setCuerpo(e.target.value)}
                rows={5}
                required
                maxLength={5000}
                disabled={enviando}
                placeholder="Explica qué está pasando, a qué animal afecta y qué necesitáis…"
                className="w-full px-3 py-2 rounded text-sm outline-none resize-none disabled:opacity-60"
                style={{ background: brand.crema, border: `1px solid ${brand.borderStrong}`, color: brand.carbon }}
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={!canSend}
                className="inline-flex items-center gap-2 px-5 py-2 rounded text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: brand.mostaza, color: brand.carbon }}
                onMouseEnter={e => {
                  if (canSend) (e.currentTarget as HTMLElement).style.background = brand.mostazaHover;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = brand.mostaza;
                }}
              >
                <Send size={16} />
                {enviando ? "Enviando…" : "Enviar aviso"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

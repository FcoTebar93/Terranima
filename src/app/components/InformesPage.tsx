import { useEffect, useRef, useState } from "react";
import { Upload, FileText, Download, Trash2, Search, Check, AlertCircle, Film } from "lucide-react";
import { brand } from "../brand";
import {
  deleteDocumento,
  fetchDocumentos,
  fetchFamilias,
  TerranimaApiError,
  uploadDocumento,
  type ApiDocumento,
  type ApiFamilia,
} from "../api/terranima";
import { isWpEmbedded } from "../wpConfig";
import { familiasDemo } from "../demoData";

interface Informe {
  id: string;
  nombre: string;
  tipo: string;
  animal: string;
  fecha: string;
  tamano: string;
  categoria: "analisis" | "vacunacion" | "radiografia" | "informe" | "receta" | "otro";
  subidoPor: "cliente" | "profesional";
  rolProfesional?: string;
  url?: string;
  familiaUserId?: number;
  familiaNombre?: string;
  puedeBorrar?: boolean;
}

interface FamiliaOption {
  id: string;
  nombre: string;
  tutor: string;
  animales: Array<{ id: string; nombre: string; especie: string }>;
}

export interface InformesPageProps {
  /** Modo profesional: elige familia asignada y sube a su expediente. */
  mode?: "familia" | "profesional";
  initialFamiliaId?: string;
  initialAnimal?: string;
  /** Rol del profesional que sube (Educación canina, Nutrición…). */
  especialidad?: string;
}

const informesData: Informe[] = [
  { id: "1", nombre: "Analítica_Luna_julio2026.pdf", tipo: "PDF", animal: "Luna", fecha: "2026-07-10", tamano: "1.2 MB", categoria: "analisis", subidoPor: "profesional", rolProfesional: "Veterinaria", familiaNombre: "Familia García López" },
  { id: "2", nombre: "Cartilla_vacunacion_Rocky.pdf", tipo: "PDF", animal: "Rocky", fecha: "2026-07-10", tamano: "0.8 MB", categoria: "vacunacion", subidoPor: "profesional", rolProfesional: "Veterinaria", familiaNombre: "Familia García López" },
  { id: "3", nombre: "Rx_torax_Luna_junio2026.jpg", tipo: "Imagen", animal: "Luna", fecha: "2026-06-05", tamano: "4.5 MB", categoria: "radiografia", subidoPor: "profesional", rolProfesional: "Veterinaria", familiaNombre: "Familia García López" },
  { id: "4", nombre: "Informe_gastroenteritis.pdf", tipo: "PDF", animal: "Luna", fecha: "2026-06-05", tamano: "0.4 MB", categoria: "informe", subidoPor: "profesional", rolProfesional: "Veterinaria", familiaNombre: "Familia García López" },
  { id: "5", nombre: "Plan_nutricional_Luna.pdf", tipo: "PDF", animal: "Luna", fecha: "2026-06-06", tamano: "0.3 MB", categoria: "informe", subidoPor: "profesional", rolProfesional: "Nutrición", familiaNombre: "Familia García López" },
  { id: "6", nombre: "Seguro_Rocky_2026.pdf", tipo: "PDF", animal: "Rocky", fecha: "2026-01-15", tamano: "2.1 MB", categoria: "otro", subidoPor: "cliente", familiaNombre: "Familia García López" },
];

function mapApiDoc(d: ApiDocumento): Informe {
  return {
    id: d.id,
    nombre: d.nombre,
    tipo: d.tipo,
    animal: d.animal || "—",
    fecha: d.fecha,
    tamano: d.tamano,
    categoria: d.categoria,
    subidoPor: d.subidoPor,
    rolProfesional: d.rolProfesional ?? undefined,
    url: d.url,
    familiaUserId: d.familiaUserId,
    familiaNombre: d.familiaNombre,
    puedeBorrar: d.puedeBorrar,
  };
}

function mapFamilia(f: ApiFamilia): FamiliaOption {
  return {
    id: String(f.id),
    nombre: f.nombre,
    tutor: f.tutor,
    animales: f.animales,
  };
}

function formatFecha(dateStr: string) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function hoyIso() {
  return new Date().toISOString().slice(0, 10);
}

export function InformesPage({ mode = "familia", initialFamiliaId, initialAnimal, especialidad }: InformesPageProps) {
  const wpMode = isWpEmbedded();
  const isProf = mode === "profesional";
  const [informes, setInformes] = useState<Informe[]>(wpMode ? [] : informesData);
  const [familias, setFamilias] = useState<FamiliaOption[]>(() =>
    isProf && !wpMode
      ? familiasDemo.map(f => ({
          id: f.id,
          nombre: f.nombre,
          tutor: f.tutor,
          animales: f.animales,
        }))
      : []
  );
  const [familiaId, setFamiliaId] = useState(() =>
    isProf
      ? (initialFamiliaId || (!wpMode ? (familiasDemo[0]?.id ?? "") : ""))
      : ""
  );
  const [animalUpload, setAnimalUpload] = useState(initialAnimal || "Luna");
  const [search, setSearch] = useState("");
  const [filterAnimal, setFilterAnimal] = useState("todos");
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(wpMode);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const familiaActiva = familias.find(f => f.id === familiaId) ?? familias[0];

  useEffect(() => {
    if (!wpMode) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        if (isProf) {
          const famList = await fetchFamilias();
          if (cancelled) return;
          const mapped = famList.map(mapFamilia);
          setFamilias(mapped);
          setFamiliaId(prev => {
            if (initialFamiliaId && mapped.some(f => f.id === initialFamiliaId)) return initialFamiliaId;
            return prev && mapped.some(f => f.id === prev) ? prev : (mapped[0]?.id ?? "");
          });
          const famForAnimal = mapped.find(f => f.id === (initialFamiliaId || mapped[0]?.id));
          if (initialAnimal) {
            setAnimalUpload(initialAnimal);
          } else if (famForAnimal?.animales[0]) {
            setAnimalUpload(famForAnimal.animales[0].nombre);
          }
          // Los documentos se cargan en el efecto de familiaId.
          if (mapped.length === 0) {
            setInformes([]);
            setLoading(false);
          }
          return;
        }
        const list = await fetchDocumentos();
        if (!cancelled) setInformes(list.map(mapApiDoc));
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof TerranimaApiError ? err.message : "No se pudieron cargar los documentos.");
      } finally {
        if (!cancelled && !isProf) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [wpMode, isProf]);

  useEffect(() => {
    if (!isProf || !initialFamiliaId) return;
    setFamiliaId(initialFamiliaId);
    if (initialAnimal) setAnimalUpload(initialAnimal);
  }, [isProf, initialFamiliaId, initialAnimal]);

  useEffect(() => {
    if (!wpMode || !isProf || !familiaId) return;
    let cancelled = false;
    setLoading(true);
    fetchDocumentos(Number(familiaId))
      .then(list => {
        if (!cancelled) setInformes(list.map(mapApiDoc));
      })
      .catch(err => {
        if (cancelled) return;
        setError(err instanceof TerranimaApiError ? err.message : "No se pudieron cargar los documentos.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [wpMode, isProf, familiaId]);

  useEffect(() => {
    if (!familiaActiva) return;
    const names = familiaActiva.animales.map(a => a.nombre);
    if (names.length && !names.includes(animalUpload)) {
      setAnimalUpload(names[0]);
    }
  }, [familiaActiva, animalUpload]);

  const animales = Array.from(
    new Set(
      (isProf && familiaActiva
        ? familiaActiva.animales.map(a => a.nombre)
        : informes.map(i => i.animal)
      ).filter(Boolean)
    )
  ).sort();

  const filtered = informes.filter(i => {
    if (isProf && familiaId && i.familiaUserId && String(i.familiaUserId) !== familiaId) {
      // En mock sin familiaUserId, filtramos por nombre.
      if (i.familiaNombre && familiaActiva && i.familiaNombre !== familiaActiva.nombre) {
        return false;
      }
    }
    const matchSearch =
      i.nombre.toLowerCase().includes(search.toLowerCase()) ||
      i.animal.toLowerCase().includes(search.toLowerCase()) ||
      (i.familiaNombre || "").toLowerCase().includes(search.toLowerCase());
    const matchAnimal = filterAnimal === "todos" || i.animal === filterAnimal;
    return matchSearch && matchAnimal;
  });

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (isProf && !familiaId) {
      setError("Selecciona una familia asignada antes de subir.");
      return;
    }
    const allowed = /\.(pdf|jpe?g|png|mp4|webm|mov|m4v)$/i;
    const tooBig = Array.from(files).find(f => f.size > 64 * 1024 * 1024);
    const badType = Array.from(files).find(f => !allowed.test(f.name));
    if (badType) {
      setError("Solo se permiten PDF, JPG, PNG y vídeo (MP4, WebM, MOV).");
      return;
    }
    if (tooBig) {
      setError("El archivo supera el tamaño máximo (64 MB).");
      return;
    }
    setUploading(true);
    setError("");
    try {
      if (wpMode) {
        const uploaded: Informe[] = [];
        for (const file of Array.from(files)) {
          const doc = await uploadDocumento({
            file,
            animal: animalUpload,
            categoria: "informe",
            familiaUserId: isProf ? Number(familiaId) : undefined,
          });
          uploaded.push(mapApiDoc(doc));
        }
        setInformes(prev => [...uploaded, ...prev]);
      } else {
        await new Promise(r => setTimeout(r, 800));
        const nuevos: Informe[] = Array.from(files).map((f, i) => ({
          id: String(Date.now() + i),
          nombre: f.name,
          tipo: f.type.startsWith("video/") ? "Vídeo" : f.type.includes("image") ? "Imagen" : "PDF",
          animal: animalUpload,
          fecha: hoyIso(),
          tamano: (f.size / 1024 / 1024).toFixed(1) + " MB",
          categoria: "informe" as const,
          subidoPor: (isProf ? "profesional" : "cliente") as "profesional" | "cliente",
          rolProfesional: isProf ? (especialidad || "Equipo") : undefined,
          familiaNombre: familiaActiva?.nombre,
          familiaUserId: familiaId ? Number(familiaId) || undefined : undefined,
          puedeBorrar: true,
        }));
        setInformes(prev => [...nuevos, ...prev]);
      }
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 2500);
    } catch (err) {
      setError(err instanceof TerranimaApiError ? err.message : "No se pudo subir el archivo.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setError("");
    try {
      if (wpMode) {
        await deleteDocumento(id);
      }
      setInformes(prev => prev.filter(i => i.id !== id));
      setDeleteId(null);
    } catch (err) {
      setError(err instanceof TerranimaApiError ? err.message : "No se pudo eliminar.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold" style={{ color: brand.ciruela }}>
          Documentos
        </h1>
        <p className="text-sm mt-1" style={{ color: brand.carbonMuted }}>
          {loading
            ? "Cargando…"
            : isProf
              ? `${informes.length} documento${informes.length === 1 ? "" : "s"}`
              : `${informes.length} documentos compartidos con el equipo`}
        </p>
      </div>

      {error && (
        <div className="rounded p-3 text-sm" style={{ background: brand.dangerSoft, color: brand.danger }}>
          {error}
        </div>
      )}

      {isProf && (
        <div
          className="rounded-lg p-4 space-y-3"
          style={{ background: brand.cremaCard, border: `1px solid ${brand.border}` }}
        >
          <div className="space-y-1.5">
            <label className="text-xs font-medium" style={{ color: brand.carbon }}>
              Familia asignada
            </label>
            <select
              value={familiaId}
              onChange={e => {
                const id = e.target.value;
                setFamiliaId(id);
                const fam = familias.find(f => f.id === id);
                if (fam?.animales[0]) setAnimalUpload(fam.animales[0].nombre);
              }}
              className="w-full px-3 py-2 rounded text-sm outline-none"
              style={{ background: brand.crema, border: `1px solid ${brand.borderStrong}`, color: brand.carbon }}
              disabled={familias.length === 0}
            >
              {familias.length === 0 ? (
                <option value="">Sin familias asignadas</option>
              ) : (
                familias.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.nombre} — {f.tutor}
                  </option>
                ))
              )}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium" style={{ color: brand.carbon }}>
              Animal
            </label>
            <select
              value={animalUpload}
              onChange={e => setAnimalUpload(e.target.value)}
              className="w-full px-3 py-2 rounded text-sm outline-none"
              style={{ background: brand.crema, border: `1px solid ${brand.borderStrong}`, color: brand.carbon }}
            >
              {(familiaActiva?.animales ?? [{ id: "luna", nombre: "Luna" }, { id: "rocky", nombre: "Rocky" }]).map(a => (
                <option key={a.id} value={a.nombre}>{a.nombre}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div
        className="rounded-lg p-6 text-center transition-all cursor-pointer"
        style={{
          background: dragging ? brand.mostazaSoft : brand.cremaCard,
          border: `2px dashed ${dragging ? brand.mostaza : brand.borderStrong}`,
          opacity: isProf && !familiaId ? 0.55 : 1,
          pointerEvents: isProf && !familiaId ? "none" : undefined,
        }}
        onDragOver={e => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => {
          e.preventDefault();
          setDragging(false);
          void handleFiles(e.dataTransfer.files);
        }}
        onClick={() => fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.mp4,.webm,.mov,.m4v"
          className="hidden"
          onChange={e => void handleFiles(e.target.files)}
        />
        {uploadSuccess ? (
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: brand.successSoft }}
            >
              <Check size={20} style={{ color: brand.success }} />
            </div>
            <p className="text-sm font-medium" style={{ color: brand.success }}>
              Archivo subido correctamente
            </p>
          </div>
        ) : uploading ? (
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: brand.mostaza, borderTopColor: "transparent" }}
            />
            <p className="text-sm" style={{ color: brand.carbonMuted }}>Subiendo archivo…</p>
          </div>
        ) : (
          <>
            <Upload
              size={28}
              className="mx-auto mb-3"
              style={{ color: dragging ? brand.mostaza : brand.carbonFaint }}
            />
            <p className="text-sm font-medium" style={{ color: brand.carbon }}>
              {dragging
                ? "Suelta el archivo aquí"
                : "Arrastra archivos aquí o haz clic para subir"}
            </p>
            <p className="text-xs mt-1" style={{ color: brand.carbonMuted }}>
              PDF, JPG, PNG o vídeo (MP4, WebM, MOV) — máx. 64 MB
            </p>
          </>
        )}
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: brand.carbonMuted }}
          />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar"
            className="w-full pl-8 pr-3 py-2 rounded text-sm outline-none"
            style={{
              background: brand.cremaCard,
              border: `1px solid ${brand.border}`,
              color: brand.carbon,
            }}
          />
        </div>
        <select
          value={filterAnimal}
          onChange={e => setFilterAnimal(e.target.value)}
          className="px-3 py-2 rounded text-sm outline-none"
          style={{
            background: brand.cremaCard,
            border: `1px solid ${brand.border}`,
            color: brand.carbon,
          }}
        >
          <option value="todos">Todos los animales</option>
          {(animales.length ? animales : ["Luna", "Rocky"]).map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div
            className="rounded-lg p-8 text-center"
            style={{ background: brand.cremaCard, border: `1px solid ${brand.border}` }}
          >
            <FileText size={28} className="mx-auto mb-2" style={{ color: brand.carbonFaint }} />
            <p className="text-sm" style={{ color: brand.carbonMuted }}>
              No se encontraron documentos
            </p>
          </div>
        ) : (
          filtered.map(informe => {
            const canDelete = informe.puedeBorrar ?? (
              isProf ? informe.subidoPor === "profesional" : informe.subidoPor === "cliente"
            );
            return (
              <div
                key={informe.id}
                className="flex items-start gap-3 sm:items-center sm:gap-4 rounded-lg px-3 sm:px-4 py-3.5"
                style={{ background: brand.cremaCard, border: `1px solid ${brand.border}` }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0"
                  style={{ background: brand.azulNocheSoft }}
                >
                  {informe.tipo === "Vídeo"
                    ? <Film size={17} style={{ color: brand.azulNoche }} />
                    : <FileText size={17} style={{ color: brand.azulNoche }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium break-words" style={{ color: brand.carbon }}>
                    {informe.nombre}
                  </p>
                  <p className="text-xs mt-1" style={{ color: brand.azulNoche }}>
                    {formatFecha(informe.fecha)}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    className="w-7 h-7 rounded flex items-center justify-center transition-all"
                    style={{ color: brand.carbonMuted }}
                    onClick={() => {
                      if (informe.url) window.open(informe.url, "_blank", "noopener,noreferrer");
                    }}
                    disabled={!informe.url && wpMode}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = brand.mostazaSoft}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                  >
                    <Download size={14} />
                  </button>
                  {canDelete &&
                    (deleteId === informe.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => void handleDelete(informe.id)}
                          className="w-7 h-7 rounded flex items-center justify-center"
                          style={{ background: brand.dangerSoft, color: brand.danger }}
                        >
                          <Check size={13} />
                        </button>
                        <button
                          onClick={() => setDeleteId(null)}
                          className="w-7 h-7 rounded flex items-center justify-center"
                          style={{ color: brand.carbonMuted }}
                        >
                          <AlertCircle size={13} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteId(informe.id)}
                        className="w-7 h-7 rounded flex items-center justify-center transition-all"
                        style={{ color: brand.carbonMuted }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLElement).style.background = brand.dangerSoft;
                          (e.currentTarget as HTMLElement).style.color = brand.danger;
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLElement).style.background = "transparent";
                          (e.currentTarget as HTMLElement).style.color = brand.carbonMuted;
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div
        className="flex items-start gap-2 p-3 rounded text-xs"
        style={{ background: brand.azulNocheSoft, color: brand.azulNoche }}
      >
        <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
        <span>
          {isProf
            ? "Solo puedes subir y gestionar documentos de familias asignadas a ti. La familia verá tus archivos en su expediente."
            : "Solo puedes eliminar los documentos que tú hayas subido. Los del equipo cooperativo permanecen en el expediente compartido."}
        </span>
      </div>
    </div>
  );
}

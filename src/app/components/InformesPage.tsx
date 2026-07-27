import { useState, useRef } from "react";
import { Upload, FileText, Download, Trash2, Search, Check, AlertCircle } from "lucide-react";
import { brand } from "../brand";

interface Informe {
  id: string;
  nombre: string;
  tipo: string;
  animal: string;
  fecha: string;
  tamano: string;
  categoria: "analisis" | "vacunacion" | "radiografia" | "informe" | "receta" | "otro";
  subidoPor: "cliente" | "profesional";
}

const informesData: Informe[] = [
  { id: "1", nombre: "Analítica_Luna_julio2026.pdf", tipo: "PDF", animal: "Luna", fecha: "2026-07-10", tamano: "1.2 MB", categoria: "analisis", subidoPor: "profesional" },
  { id: "2", nombre: "Cartilla_vacunacion_Rocky.pdf", tipo: "PDF", animal: "Rocky", fecha: "2026-07-10", tamano: "0.8 MB", categoria: "vacunacion", subidoPor: "profesional" },
  { id: "3", nombre: "Rx_torax_Luna_junio2026.jpg", tipo: "Imagen", animal: "Luna", fecha: "2026-06-05", tamano: "4.5 MB", categoria: "radiografia", subidoPor: "profesional" },
  { id: "4", nombre: "Informe_gastroenteritis.pdf", tipo: "PDF", animal: "Luna", fecha: "2026-06-05", tamano: "0.4 MB", categoria: "informe", subidoPor: "profesional" },
  { id: "5", nombre: "Plan_nutricional_Luna.pdf", tipo: "PDF", animal: "Luna", fecha: "2026-06-06", tamano: "0.3 MB", categoria: "informe", subidoPor: "profesional" },
  { id: "6", nombre: "Seguro_Rocky_2026.pdf", tipo: "PDF", animal: "Rocky", fecha: "2026-01-15", tamano: "2.1 MB", categoria: "otro", subidoPor: "cliente" },
];

const categoriaConfig: Record<string, { label: string; color: string; bg: string }> = {
  analisis: { label: "Análisis", color: brand.azulNoche, bg: brand.azulNocheSoft },
  vacunacion: { label: "Vacunación", color: brand.ciruela, bg: brand.ciruelaSoft },
  radiografia: { label: "Radiografía", color: brand.azulNoche, bg: brand.azulNocheSoft },
  informe: { label: "Informe", color: brand.carbon, bg: brand.mostazaSoft },
  receta: { label: "Receta", color: brand.danger, bg: brand.dangerSoft },
  otro: { label: "Otro", color: brand.carbonMuted, bg: brand.crema },
};

function formatFecha(dateStr: string) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function InformesPage() {
  const [informes, setInformes] = useState(informesData);
  const [search, setSearch] = useState("");
  const [filterAnimal, setFilterAnimal] = useState("todos");
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = informes.filter(i => {
    const matchSearch =
      i.nombre.toLowerCase().includes(search.toLowerCase()) ||
      i.animal.toLowerCase().includes(search.toLowerCase());
    const matchAnimal = filterAnimal === "todos" || i.animal === filterAnimal;
    return matchSearch && matchAnimal;
  });

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setTimeout(() => {
      const nuevos: Informe[] = Array.from(files).map((f, i) => ({
        id: String(Date.now() + i),
        nombre: f.name,
        tipo: f.type.includes("image") ? "Imagen" : "PDF",
        animal: "Luna",
        fecha: "2026-07-27",
        tamano: (f.size / 1024 / 1024).toFixed(1) + " MB",
        categoria: "otro" as const,
        subidoPor: "cliente" as const,
      }));
      setInformes(prev => [...nuevos, ...prev]);
      setUploading(false);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 2500);
    }, 1200);
  };

  const handleDelete = (id: string) => {
    setInformes(prev => prev.filter(i => i.id !== id));
    setDeleteId(null);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold" style={{ color: brand.ciruela }}>
          Documentos
        </h1>
        <p className="text-sm mt-1" style={{ color: brand.carbonMuted }}>
          {informes.length} documentos compartidos con el equipo
        </p>
      </div>

      <div
        className="rounded-lg p-6 text-center transition-all cursor-pointer"
        style={{
          background: dragging ? brand.mostazaSoft : brand.cremaCard,
          border: `2px dashed ${dragging ? brand.mostaza : brand.borderStrong}`,
        }}
        onDragOver={e => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
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
            <p
              className="text-sm font-medium"
              style={{ color: dragging ? brand.carbon : brand.carbon }}
            >
              {dragging ? "Suelta el archivo aquí" : "Arrastra archivos aquí o haz clic para subir"}
            </p>
            <p className="text-xs mt-1" style={{ color: brand.carbonMuted }}>
              PDF, JPG, PNG, DOC — máx. 20 MB por archivo
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
            placeholder="Buscar por nombre o animal…"
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
          <option>Luna</option>
          <option>Rocky</option>
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
            const cat = categoriaConfig[informe.categoria];
            return (
              <div
                key={informe.id}
                className="flex items-center gap-4 rounded-lg px-4 py-3.5"
                style={{ background: brand.cremaCard, border: `1px solid ${brand.border}` }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: cat.bg }}
                >
                  <FileText size={17} style={{ color: cat.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate" style={{ color: brand.carbon }}>
                      {informe.nombre}
                    </p>
                    {informe.subidoPor === "profesional" && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded flex-shrink-0"
                        style={{ background: brand.ciruelaSoft, color: brand.ciruela }}
                      >
                        Equipo
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs" style={{ color: brand.carbonMuted }}>{informe.animal}</span>
                    <span className="text-xs" style={{ color: brand.carbonFaint }}>·</span>
                    <span className="text-xs" style={{ color: brand.azulNoche }}>
                      {formatFecha(informe.fecha)}
                    </span>
                    <span className="text-xs" style={{ color: brand.carbonFaint }}>·</span>
                    <span className="text-xs" style={{ color: brand.carbonMuted }}>{informe.tamano}</span>
                  </div>
                </div>
                <span
                  className="text-xs px-1.5 py-0.5 rounded hidden sm:block flex-shrink-0"
                  style={{ background: cat.bg, color: cat.color }}
                >
                  {cat.label}
                </span>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    className="w-7 h-7 rounded flex items-center justify-center transition-all"
                    style={{ color: brand.carbonMuted }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = brand.mostazaSoft}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                  >
                    <Download size={14} />
                  </button>
                  {informe.subidoPor === "cliente" &&
                    (deleteId === informe.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(informe.id)}
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
          Solo puedes eliminar los documentos que tú hayas subido. Los marcados como «Equipo» los
          añade el equipo cooperativo y permanecen en el expediente compartido.
        </span>
      </div>
    </div>
  );
}

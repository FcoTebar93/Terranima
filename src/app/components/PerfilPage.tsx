import { useState, useRef } from "react";
import { Edit2, Check, X, Camera } from "lucide-react";
import { brand, UserRole } from "../brand";

interface Animal {
  id: string;
  nombre: string;
  especie: string;
  raza: string;
  sexo: "macho" | "hembra";
  edad: number;
  fechaNacimiento: string;
  color: string;
  peso: string;
  microchip: string;
  notasProfesional: string;
  notasTutor: string;
  avatarColor: string;
  inicial: string;
  foto?: string;
}

/** Campos que el tutor puede editar; el profesional puede editar todos */
const CAMPOS_TUTOR: (keyof Animal)[] = ["peso", "notasTutor"];

const animalesData: Animal[] = [
  {
    id: "1",
    nombre: "Luna",
    especie: "Gato",
    raza: "Europea común",
    sexo: "hembra",
    edad: 4,
    fechaNacimiento: "2022-03-15",
    color: "Atigrada gris",
    peso: "4,2 kg",
    microchip: "941000024871562",
    notasProfesional: "Alergia leve a ciertos piensos con cereales. Dieta hipoalergénica recomendada.",
    notasTutor: "Prefiere comida húmeda por la mañana. Evita el contacto con otros gatos en el patio.",
    avatarColor: brand.ciruela,
    inicial: "L",
  },
  {
    id: "2",
    nombre: "Rocky",
    especie: "Perro",
    raza: "Labrador Retriever",
    sexo: "macho",
    edad: 2,
    fechaNacimiento: "2024-05-08",
    color: "Dorado",
    peso: "28,5 kg",
    microchip: "941000031245789",
    notasProfesional: "En seguimiento por episodio de gastroenteritis julio 2026. Evolución favorable.",
    notasTutor: "Muy activo; necesita paseos largos. Se pone nervioso con truenos.",
    avatarColor: brand.mostaza,
    inicial: "R",
  },
];

function formatFecha(dateStr: string) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

interface Campo {
  label: string;
  key: keyof Animal;
  tipo: "text" | "select" | "textarea";
  opciones?: string[];
}

const camposFicha: Campo[] = [
  { label: "Nombre", key: "nombre", tipo: "text" },
  { label: "Especie", key: "especie", tipo: "select", opciones: ["Perro", "Gato", "Conejo", "Ave", "Otro"] },
  { label: "Raza", key: "raza", tipo: "text" },
  { label: "Sexo", key: "sexo", tipo: "select", opciones: ["macho", "hembra"] },
  { label: "Color / capa", key: "color", tipo: "text" },
  { label: "Peso", key: "peso", tipo: "text" },
  { label: "Fecha de nacimiento", key: "fechaNacimiento", tipo: "text" },
  { label: "Microchip", key: "microchip", tipo: "text" },
  { label: "Notas de profesional", key: "notasProfesional", tipo: "textarea" },
  { label: "Notas de tutor/a", key: "notasTutor", tipo: "textarea" },
];

interface PerfilPageProps {
  role?: UserRole;
}

export function PerfilPage({ role = "tutor" }: PerfilPageProps) {
  const [animales, setAnimales] = useState(animalesData);
  const [selectedId, setSelectedId] = useState(animalesData[0].id);
  const [editando, setEditando] = useState<keyof Animal | null>(null);
  const [valorEdit, setValorEdit] = useState<string>("");
  const fotoRef = useRef<HTMLInputElement>(null);

  const animal = animales.find(a => a.id === selectedId)!;
  const puedeEditar = (key: keyof Animal) =>
    role === "profesional" || CAMPOS_TUTOR.includes(key);

  const startEdit = (campo: Campo) => {
    if (!puedeEditar(campo.key)) return;
    setEditando(campo.key);
    setValorEdit(String(animal[campo.key] ?? ""));
  };

  const saveEdit = () => {
    if (!editando) return;
    setAnimales(prev => prev.map(a => {
      if (a.id !== selectedId) return a;
      return { ...a, [editando]: valorEdit };
    }));
    setEditando(null);
  };

  const cancelEdit = () => setEditando(null);

  const handleFoto = (files: FileList | null) => {
    if (!files?.[0]) return;
    const url = URL.createObjectURL(files[0]);
    setAnimales(prev => prev.map(a => (a.id === selectedId ? { ...a, foto: url } : a)));
  };

  const renderValor = (campo: Campo) => {
    const val = animal[campo.key];
    if (campo.key === "fechaNacimiento") return formatFecha(String(val));
    if (campo.key === "sexo") return (val as string) === "macho" ? "Macho" : "Hembra";
    return String(val ?? "");
  };

  const isNotas = (key: keyof Animal) => key === "notasProfesional" || key === "notasTutor";

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold" style={{ color: brand.ciruela }}>
          Mis animales
        </h1>
        <p className="text-sm mt-1" style={{ color: brand.carbonMuted }}>
          Información y notas compartidas con el equipo
        </p>
      </div>

      {animales.length > 1 && (
        <div className="flex gap-2">
          {animales.map(a => (
            <button
              key={a.id}
              onClick={() => { setSelectedId(a.id); setEditando(null); }}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
              style={{
                background: selectedId === a.id ? brand.ciruela : brand.cremaCard,
                color: selectedId === a.id ? brand.crema : brand.carbon,
                border: `1px solid ${selectedId === a.id ? brand.ciruela : brand.border}`,
              }}
            >
              {a.foto ? (
                <img src={a.foto} alt="" className="w-7 h-7 rounded-full object-cover" />
              ) : (
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold font-display"
                  style={{
                    background: selectedId === a.id ? "rgba(255,255,255,0.2)" : a.avatarColor + "22",
                    color: selectedId === a.id ? brand.crema : a.avatarColor,
                  }}
                >
                  {a.inicial}
                </span>
              )}
              <span>{a.nombre}</span>
            </button>
          ))}
        </div>
      )}

      <div
        className="rounded-lg overflow-hidden"
        style={{ background: brand.cremaCard, border: `1px solid ${brand.border}` }}
      >
        <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${brand.ciruela}, ${brand.mostaza})` }} />
        <div className="px-6 py-5 flex items-center gap-5">
          <div className="relative flex-shrink-0">
            {animal.foto ? (
              <img
                src={animal.foto}
                alt={animal.nombre}
                className="w-16 h-16 rounded-full object-cover"
                style={{ border: `2px solid ${animal.avatarColor}33` }}
              />
            ) : (
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-display font-semibold"
                style={{ background: animal.avatarColor + "22", color: animal.avatarColor }}
              >
                {animal.inicial}
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
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-display text-lg font-semibold" style={{ color: brand.ciruela }}>
                {animal.nombre}
              </h2>
              <span
                className="text-xs px-2 py-0.5 rounded uppercase tracking-wider"
                style={{ background: animal.avatarColor + "18", color: animal.avatarColor, letterSpacing: "0.06em" }}
              >
                {animal.especie}
              </span>
            </div>
            <p className="text-sm mt-1" style={{ color: brand.carbonMuted }}>
              {animal.raza} · {animal.sexo === "macho" ? "Macho" : "Hembra"} · {animal.edad} años
            </p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-xs" style={{ color: brand.carbonMuted }}>Peso actual</p>
            <p className="text-xl font-semibold mt-0.5 font-display" style={{ color: brand.azulNoche }}>
              {animal.peso}
            </p>
          </div>
        </div>
      </div>

      <div
        className="rounded-lg overflow-hidden"
        style={{ background: brand.cremaCard, border: `1px solid ${brand.border}` }}
      >
        <div className="px-5 py-3.5" style={{ borderBottom: `1px solid ${brand.border}`, background: brand.crema }}>
          <h3
            className="text-xs font-medium uppercase tracking-widest"
            style={{ color: brand.carbonMuted, letterSpacing: "0.1em" }}
          >
            Datos del animal
          </h3>
        </div>
        <div className="divide-y" style={{ borderColor: brand.border }}>
          {camposFicha.map(campo => {
            const isEditing = editando === campo.key;
            const editable = puedeEditar(campo.key);
            return (
              <div key={String(campo.key)} className="flex items-start gap-4 px-5 py-3.5 group">
                <div className="w-36 flex-shrink-0">
                  <p className="text-xs font-medium" style={{ color: brand.carbonMuted }}>{campo.label}</p>
                </div>
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
                          type={campo.key === "fechaNacimiento" ? "date" : "text"}
                          className="flex-1 px-2 py-1.5 rounded text-sm outline-none"
                          style={{ background: brand.crema, border: `1px solid ${brand.mostaza}`, color: brand.carbon }}
                          value={valorEdit}
                          onChange={e => setValorEdit(e.target.value)}
                          autoFocus
                        />
                      )}
                      <button
                        onClick={saveEdit}
                        className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: brand.successSoft, color: brand.success }}
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: brand.dangerSoft, color: brand.danger }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={`text-sm ${isNotas(campo.key) ? "leading-relaxed" : ""} ${campo.key === "microchip" ? "font-mono tracking-wider" : ""}`}
                        style={{ color: brand.carbon }}
                      >
                        {renderValor(campo)}
                      </p>
                      {editable && (
                        <button
                          onClick={() => startEdit(campo)}
                          className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ color: brand.carbonMuted }}
                          onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.background = brand.mostazaSoft;
                            (e.currentTarget as HTMLElement).style.color = brand.carbon;
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.background = "transparent";
                            (e.currentTarget as HTMLElement).style.color = brand.carbonMuted;
                          }}
                          title="Editar"
                        >
                          <Edit2 size={12} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-center pb-2" style={{ color: brand.carbonFaint }}>
        {role === "tutor"
          ? "Como tutor/a puedes editar el peso y tus notas · El resto lo completa el equipo"
          : "Haz clic en el lápiz para editar · Los cambios quedan en el perfil compartido"}
      </p>
    </div>
  );
}

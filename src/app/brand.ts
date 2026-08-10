/** Tokens del manual de identidad Terrànima */
export const brand = {
  mostaza: "#D9A441",
  mostazaSoft: "#F3E4C4",
  mostazaHover: "#C4922F",
  ciruela: "#7B3F5E",
  ciruelaSoft: "#F0E4EA",
  azulNoche: "#2E4057",
  azulNocheSoft: "#E8ECF0",
  crema: "#F7F0E3",
  cremaCard: "#FFFCFA",
  carbon: "#2C2C2A",
  carbonMuted: "#6B6560",
  carbonFaint: "#A39E96",
  border: "rgba(44, 44, 42, 0.1)",
  borderStrong: "rgba(44, 44, 42, 0.16)",
  danger: "#A63D3D",
  dangerSoft: "#F8EAEA",
  success: "#2E4057",
  successSoft: "#E8ECF0",
} as const;

/** Especialidades / roles profesionales visibles en la UI */
export const especialidades = [
  "Educación canina",
  "Nutrición",
  "Terapia familiar",
] as const;

export type Especialidad = (typeof especialidades)[number];

/** Asignación automática de profesional según especialidad elegida */
export const profesionalPorEspecialidad: Record<Especialidad, string> = {
  "Educación canina": "Educación canina",
  Nutrición: "Nutrición",
  "Terapia familiar": "Terapia familiar",
};

/**
 * Tipo de usuario en la ficha (viene del backend).
 * 1 = usuario / familia (tutor)
 * 2 = profesional
 */
export type TipoUsuario = 1 | 2;

export const TIPO_USUARIO = 1 as const;
export const TIPO_PROFESIONAL = 2 as const;

export type UserRole = "tutor" | "profesional";

export function roleFromTipo(tipo: TipoUsuario): UserRole {
  return tipo === TIPO_PROFESIONAL ? "profesional" : "tutor";
}

export function isProfesionalTipo(tipo: TipoUsuario): boolean {
  return tipo === TIPO_PROFESIONAL;
}

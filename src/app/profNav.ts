export type ProfChatKind = "cliente" | "equipo";

/** Contexto al saltar desde la ficha de un caso a otra sección profesional. */
export type ProfFocus = {
  familiaId?: string;
  animalNombre?: string;
  chatKind?: ProfChatKind;
  openCreate?: boolean;
};

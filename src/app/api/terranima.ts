import { getWpConfig, setWpNonce } from "../wpConfig";
import type { AppUser } from "../components/LoginPage";
import { roleFromTipo, TipoUsuario, Especialidad } from "../brand";
import type { CitaDemo } from "../demoData";

export class TerranimaApiError extends Error {
  status: number;
  code: string;

  constructor(message: string, status: number, code = "") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

interface ApiUserPayload {
  id?: number;
  name: string;
  email: string;
  tipo: TipoUsuario;
  role?: "tutor" | "profesional";
  numeroSocio: string;
  direccion: string;
  especialidad?: Especialidad | string | null;
  nonce?: string;
}

export type ApiCita = CitaDemo & {
  especialidad?: string;
  familiaUserId?: number;
  direccion?: string;
};

function toAppUser(payload: ApiUserPayload): AppUser {
  if (payload.nonce) {
    setWpNonce(payload.nonce);
  }

  return {
    id: payload.id,
    name: payload.name,
    email: payload.email,
    tipo: payload.tipo,
    role: payload.role ?? roleFromTipo(payload.tipo),
    numeroSocio: payload.numeroSocio ?? "",
    direccion: payload.direccion ?? "",
    especialidad: (payload.especialidad ?? undefined) as Especialidad | undefined,
  };
}

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const config = getWpConfig();
  if (!config) {
    throw new TerranimaApiError("Configuración WordPress no disponible.", 0);
  }

  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  headers.set("X-WP-Nonce", config.nonce);
  const isFormData = typeof FormData !== "undefined" && init.body instanceof FormData;
  if (init.body && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${config.restUrl}${path}`, {
    ...init,
    headers,
    credentials: "same-origin",
  });

  let data: unknown = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    const obj = data as { message?: string; code?: string };
    const code = obj.code ? String(obj.code) : "";
    const raw = obj.message ? String(obj.message) : "";
    const message =
      code === "rest_cookie_invalid_nonce" || /cookie check/i.test(raw)
        ? "La sesión ha caducado. Vuelve a iniciar sesión."
        : (raw || "Error de comunicación con el servidor.");
    throw new TerranimaApiError(message, response.status, code);
  }

  return data as T;
}

export async function fetchMe(): Promise<AppUser> {
  const data = await apiFetch<ApiUserPayload>("/me");
  return toAppUser(data);
}

export async function login(email: string, password: string): Promise<AppUser> {
  const data = await apiFetch<ApiUserPayload>("/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return toAppUser(data);
}

export async function logout(): Promise<void> {
  await apiFetch<{ success: boolean }>("/logout", { method: "POST" });
}

export async function fetchCitas(): Promise<ApiCita[]> {
  return apiFetch<ApiCita[]>("/citas");
}

export async function createCita(input: {
  fecha: string;
  hora: string;
  tipo: string;
  animal: string;
  notas?: string;
  familiaUserId?: number;
}): Promise<ApiCita> {
  return apiFetch<ApiCita>("/citas", {
    method: "POST",
    body: JSON.stringify({
      fecha: input.fecha,
      hora: input.hora,
      tipo: input.tipo,
      especialidad: input.tipo,
      animal: input.animal,
      notas: input.notas ?? "",
      familia_user_id: input.familiaUserId,
    }),
  });
}

export async function patchCitaEstado(
  id: string,
  estado: CitaDemo["estado"]
): Promise<ApiCita> {
  return apiFetch<ApiCita>(`/citas/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ estado }),
  });
}

export type ApiDocumento = {
  id: string;
  nombre: string;
  tipo: string;
  animal: string;
  fecha: string;
  tamano: string;
  categoria: "analisis" | "vacunacion" | "radiografia" | "informe" | "receta" | "otro";
  subidoPor: "cliente" | "profesional";
  rolProfesional?: string | null;
  url?: string;
  familiaUserId?: number;
  familiaNombre?: string;
  puedeBorrar?: boolean;
};

export type ApiMensaje = {
  id: string;
  texto: string;
  autor: "cliente" | "profesional";
  autorNombre?: string;
  autorEspecialidad?: string | null;
  senderId?: number;
  mio?: boolean;
  hora: string;
  fecha: string;
  leido: boolean;
};

export type ApiChat = {
  id: string;
  nombre: string;
  especialidad?: string;
  especialidadLabel?: string;
  ambito: "familia" | "animal" | "equipo";
  kind?: "cliente" | "equipo";
  animal: string | null;
  subtitulo: string;
  familiaUserId?: number;
  familiaNombre?: string;
  tutor?: string;
  direccion?: string;
  peerUserId?: number;
  peerNombre?: string;
  peerEspecialidad?: string;
  noLeidos: number;
  enLinea?: boolean;
  preview?: string;
  previewAutor?: "cliente" | "profesional" | null;
  previewHora?: string;
  previewFecha?: string;
  mensajes: ApiMensaje[];
};

export type ApiAnimal = {
  id: string;
  nombre: string;
  especie: string;
  raza?: string;
  sexo?: string;
  edad?: number;
  fechaNacimiento?: string;
  color?: string;
  peso?: string;
  microchip?: string;
  notasProfesional?: string;
  notasTutor?: string;
};

export type ApiProfesionalEquipo = {
  id: number;
  nombre: string;
  especialidad: string;
  especialidadSlug?: string;
};

export type ApiFamilia = {
  id: number;
  nombre: string;
  tutor: string;
  email: string;
  direccion: string;
  numeroSocio?: string;
  animales: ApiAnimal[];
  equipo?: ApiProfesionalEquipo[];
};

export async function fetchDocumentos(familiaUserId?: number): Promise<ApiDocumento[]> {
  const qs = familiaUserId ? `?familia_user_id=${familiaUserId}` : "";
  return apiFetch<ApiDocumento[]>(`/documentos${qs}`);
}

export async function uploadDocumento(input: {
  file: File;
  animal?: string;
  categoria?: string;
  familiaUserId?: number;
}): Promise<ApiDocumento> {
  const form = new FormData();
  form.append("file", input.file);
  if (input.animal) form.append("animal", input.animal);
  if (input.categoria) form.append("categoria", input.categoria);
  if (input.familiaUserId) form.append("familia_user_id", String(input.familiaUserId));
  return apiFetch<ApiDocumento>("/documentos", {
    method: "POST",
    body: form,
  });
}

export async function deleteDocumento(id: string): Promise<void> {
  await apiFetch<{ success: boolean }>(`/documentos/${id}`, { method: "DELETE" });
}

export async function fetchChats(): Promise<ApiChat[]> {
  return apiFetch<ApiChat[]>("/chats");
}

export async function fetchChat(id: string): Promise<ApiChat> {
  return apiFetch<ApiChat>(`/chats/${id}`);
}

export async function createChat(input: {
  familiaUserId?: number;
  especialidad?: string;
  ambito?: "familia" | "animal" | "equipo";
  kind?: "cliente" | "equipo";
  animal?: string;
  peerUserId?: number | string;
}): Promise<ApiChat> {
  return apiFetch<ApiChat>("/chats", {
    method: "POST",
    body: JSON.stringify({
      familia_user_id: input.familiaUserId,
      especialidad: input.especialidad,
      ambito: input.ambito,
      kind: input.kind,
      animal: input.animal,
      peer_user_id: input.peerUserId,
    }),
  });
}

export async function sendChatMessage(chatId: string, texto: string): Promise<ApiMensaje> {
  return apiFetch<ApiMensaje>(`/chats/${chatId}/messages`, {
    method: "POST",
    body: JSON.stringify({ texto }),
  });
}

export async function markChatRead(chatId: string): Promise<void> {
  await apiFetch<{ success: boolean }>(`/chats/${chatId}/read`, { method: "POST" });
}

export async function fetchFamilias(): Promise<ApiFamilia[]> {
  return apiFetch<ApiFamilia[]>("/familias");
}

export async function fetchProfesionales(): Promise<ApiProfesionalEquipo[]> {
  return apiFetch<ApiProfesionalEquipo[]>("/profesionales");
}

export function isSessionError(err: TerranimaApiError): boolean {
  return (
    err.status === 401
    || err.code === "rest_cookie_invalid_nonce"
    || err.code === "terranima_not_logged_in"
  );
}

export function isAccessDeniedError(err: TerranimaApiError): boolean {
  return err.status === 403 && err.code === "terranima_forbidden";
}

import { getWpConfig, setWpNonce } from "../wpConfig";
import type { AppUser } from "../components/LoginPage";
import { roleFromTipo, TipoUsuario, Especialidad } from "../brand";

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

function toAppUser(payload: ApiUserPayload): AppUser {
  if (payload.nonce) {
    setWpNonce(payload.nonce);
  }

  return {
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
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${config.restUrl}${path}`, {
    ...init,
    headers,
    credentials: "same-origin",
  });

  let data: { message?: string; code?: string } | ApiUserPayload | { success?: boolean } = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    const message =
      typeof data === "object" && data && "message" in data && data.message
        ? String(data.message)
        : "Error de comunicación con el servidor.";
    const code =
      typeof data === "object" && data && "code" in data && data.code
        ? String(data.code)
        : "";
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

/** Errores de sesión/nonce que deben mostrar login, no pantalla de acceso denegado. */
export function isSessionError(err: TerranimaApiError): boolean {
  return (
    err.status === 401
    || err.code === "rest_cookie_invalid_nonce"
    || err.code === "terranima_not_logged_in"
  );
}

/** Usuario logueado en WP pero sin rol Terranima. */
export function isAccessDeniedError(err: TerranimaApiError): boolean {
  return err.status === 403 && err.code === "terranima_forbidden";
}

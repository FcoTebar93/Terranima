export interface TerranimaWpConfig {
  restUrl: string;
  nonce: string;
  profileUrl: string;
  loginUrl: string;
  lostPasswordUrl?: string;
  wpAdminLoginUrl?: string;
}

const PORTAL_TOKEN_KEY = "terranima_portal_token";

declare global {
  interface Window {
    __TERRANIMA__?: TerranimaWpConfig;
  }
}

export function getWpConfig(): TerranimaWpConfig | null {
  return window.__TERRANIMA__ ?? null;
}

/** Actualiza el nonce REST tras login (WordPress genera uno nuevo por sesión). */
export function setWpNonce(nonce: string): void {
  if (window.__TERRANIMA__) {
    window.__TERRANIMA__.nonce = nonce;
  }
}

/** Token de sesión del portal (respaldo si la cookie HttpOnly no llega a /wp-json). */
export function setPortalToken(token: string): void {
  try {
    if (token) {
      sessionStorage.setItem(PORTAL_TOKEN_KEY, token);
    } else {
      sessionStorage.removeItem(PORTAL_TOKEN_KEY);
    }
  } catch {
    // sessionStorage no disponible
  }
}

export function getPortalToken(): string {
  try {
    return sessionStorage.getItem(PORTAL_TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

export function clearPortalToken(): void {
  setPortalToken("");
}

/** True cuando la SPA corre embebida en WordPress (/profile). */
export function isWpEmbedded(): boolean {
  return !!window.__TERRANIMA__;
}

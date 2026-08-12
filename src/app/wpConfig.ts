export interface TerranimaWpConfig {
  restUrl: string;
  nonce: string;
  profileUrl: string;
  loginUrl: string;
}

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

/** True cuando la SPA corre embebida en WordPress (/profile). */
export function isWpEmbedded(): boolean {
  return !!window.__TERRANIMA__;
}

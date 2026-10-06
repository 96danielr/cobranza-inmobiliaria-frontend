/** Builds the 3D vignette `kind` inside `host` and animates it while on screen. Returns a cleanup. */
export function mountMiniScene(host: HTMLElement, kind: 'secure' | 'close'): () => void

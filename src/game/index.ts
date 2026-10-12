/**
 * The slot for the new game.
 *
 * The site does NOT contain a game yet. This file is the single seam where it plugs in.
 *
 * Easiest path (no code changes): host the finished game anywhere on https, set
 * VITE_GAME_URL in a .env file, rebuild and redeploy. The "Play" button turns on and loads the
 * game into the frame.
 *
 * Other path: replace the body of mountGame() to start a bundled game into `container`
 * (for example a canvas or a framework app) and return a handle whose destroy() cleans up.
 */

export interface GameHandle {
  destroy(): void;
}

const raw = (import.meta.env.VITE_GAME_URL as string | undefined)?.trim() ?? "";

/** Only https URLs are accepted, so a typo cannot load something unexpected. */
export const GAME_URL: string = /^https:\/\//i.test(raw) ? raw : "";

export function gameReady(): boolean {
  return GAME_URL.length > 0;
}

export function mountGame(container: HTMLElement): GameHandle {
  const frame = document.createElement("iframe");
  frame.src = GAME_URL;
  frame.title = "Math game";
  frame.allow = "fullscreen; gamepad; autoplay";
  frame.setAttribute("sandbox", "allow-scripts allow-same-origin allow-pointer-lock allow-popups allow-forms");
  frame.loading = "lazy";
  container.appendChild(frame);
  return { destroy: () => frame.remove() };
}

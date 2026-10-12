import { gameReady, mountGame, type GameHandle } from "../game";

/** The slot for the new game. Until VITE_GAME_URL is set, it shows a placeholder and a disabled Play button. */
export function initGame(): void {
  const play = document.getElementById("game-play") as HTMLButtonElement | null;
  const state = document.getElementById("game-state");
  const mount = document.getElementById("game-mount");
  const placeholder = document.getElementById("game-placeholder");
  if (!play || !state || !mount) return;

  let handle: GameHandle | null = null;

  if (!gameReady()) {
    play.setAttribute("aria-disabled", "true");
    state.textContent = "Coming soon";
    play.addEventListener("click", () => {
      state.textContent = "The new version is still being built.";
    });
    return;
  }

  play.setAttribute("aria-disabled", "false");
  state.textContent = "Ready to play";
  play.addEventListener("click", () => {
    if (handle) return;
    placeholder?.remove();
    mount.classList.add("live");
    handle = mountGame(mount);
    play.setAttribute("aria-disabled", "true");
    play.textContent = "Playing";
    state.textContent = "Use fullscreen inside the game for the best view.";
  });
}

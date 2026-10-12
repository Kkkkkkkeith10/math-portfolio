import { gameReady, mountGame, type GameHandle } from "../game";

const STEPS = [
  {
    title: "Collect",
    body: "Students earned items for practising, so opening the app felt like play and not like homework.",
  },
  {
    title: "Live it",
    body: "Feedback from teachers and students pushed the same game toward everyday challenges, where the maths turns up inside a real situation. The point: knowledge should not stay on the page.",
  },
  {
    title: "Play the new one",
    body: "A rebuilt version is in progress. It will be playable in the frame just below.",
  },
];

export function initGame(): void {
  // Evolution stepper
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>("#evo-steps button"));
  const panel = document.getElementById("evo-panel");
  const stage = document.getElementById("game-stage");
  if (panel) {
    const show = (i: number): void => {
      buttons.forEach((b, k) => b.setAttribute("aria-selected", String(k === i)));
      const h = document.createElement("h3");
      h.textContent = STEPS[i].title;
      const p = document.createElement("p");
      p.textContent = STEPS[i].body;
      panel.replaceChildren(h, p);
      if (i === 2 && stage) stage.scrollIntoView({ behavior: "smooth", block: "center" });
    };
    buttons.forEach((b, i) => b.addEventListener("click", () => show(i)));
    show(0);
  }

  // Game slot
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

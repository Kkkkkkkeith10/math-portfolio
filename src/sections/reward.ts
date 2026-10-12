import { gsap } from "gsap";
import { counter, scene } from "../scene";

const COLS = 8;
const ROWS = 6;

export function initReward(): void {
  const cover = document.getElementById("cover");
  if (cover) {
    cover.style.setProperty("--cols", String(COLS));
    for (let i = 0; i < COLS * ROWS; i++) cover.appendChild(document.createElement("i"));
  }

  const flip = document.getElementById("flip") as HTMLButtonElement | null;
  const inner = flip?.querySelector<HTMLElement>(".flip__in") ?? null;

  scene(document.querySelector<HTMLElement>('[data-scene="reward"]'), (tl, q) => {
    // 1. Cover the rectangle: 48 squares, counted as they fill.
    const cells = q("#cover i");
    const fillEach = 0.035;
    tl.fromTo(q(".rew__cell"), { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.12 }, 0);
    tl.fromTo(cells, { scale: 0.2, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.25, ease: "back.out(2)", stagger: fillEach }, 0.7);
    const fillEnd = 0.7 + fillEach * (COLS * ROWS - 1) + 0.25;
    counter(tl, document.getElementById("cover-n"), COLS * ROWS, 0.7, fillEach * (COLS * ROWS - 1) + 0.25);

    // 2. Coins drop into the jar.
    const coinsAt = fillEnd + 0.3;
    tl.fromTo(q(".flycoins span"), { y: -110, opacity: 0, scale: 0.6 }, { y: 20, opacity: 1, scale: 1, duration: 0.55, ease: "bounce.out", stagger: 0.12 }, coinsAt);
    tl.to(q(".flycoins span"), { opacity: 0, duration: 0.25 }, coinsAt + 1.1);
    tl.fromTo(q(".coin-stack"), { y: 6 }, { y: 0, duration: 0.5, ease: "back.out(3)" }, coinsAt + 0.6);
    counter(tl, document.getElementById("coin-n"), 10, coinsAt, 0.9);

    // 3. The Find card turns over.
    const cardAt = coinsAt + 1.3;
    if (inner) tl.fromTo(inner, { rotateY: 0 }, { rotateY: 180, duration: 0.9, ease: "power2.inOut" }, cardAt);

    // 4. A trophy slot lights up.
    const trophyAt = cardAt + 0.9;
    tl.fromTo(q(".slot--new"), { scale: 0.3, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.7, ease: "back.out(2.6)" }, trophyAt);
    tl.fromTo(q(".slot--new"), { boxShadow: "0 0 0 0 rgba(242,193,78,0)" }, { boxShadow: "0 0 0 8px rgba(242,193,78,0.5)", duration: 0.5, yoyo: true, repeat: 1 }, trophyAt + 0.6);
  });

  // The card can also be turned by hand.
  flip?.addEventListener("click", () => {
    if (!inner) return;
    const turned = Number(gsap.getProperty(inner, "rotateY")) > 90;
    flip.setAttribute("aria-pressed", String(!turned));
    gsap.to(inner, { rotateY: turned ? 0 : 180, duration: 0.6, ease: "power2.inOut", overwrite: "auto" });
  });
}

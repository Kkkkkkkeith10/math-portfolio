import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { reduced } from "./motion";

gsap.registerPlugin(ScrollTrigger);

type Build = (tl: gsap.core.Timeline, q: gsap.utils.SelectorFunc) => void;

/**
 * A scene is a paused timeline that plays by itself the first time it scrolls into view,
 * and again whenever its Replay button is pressed.
 *
 * Build rules, so replays are exact: animate with from/fromTo/set (GSAP rewinds them), and derive any
 * text from the timeline's time instead of mutating the DOM in callbacks.
 */
export function scene(root: HTMLElement | null, build: Build, onReplay?: () => void): gsap.core.Timeline | null {
  if (!root) return null;
  const tl = gsap.timeline({ paused: true });
  build(tl, gsap.utils.selector(root));

  const play = (): void => {
    onReplay?.();
    if (reduced()) tl.progress(1, false).pause();
    else tl.restart();
  };

  ScrollTrigger.create({ trigger: root, start: "top 72%", once: true, onEnter: play });
  root.querySelectorAll<HTMLElement>("[data-replay]").forEach((btn) => btn.addEventListener("click", play));
  return tl;
}

/** Count a number up as the timeline plays. Safe to rewind. */
export function counter(
  tl: gsap.core.Timeline,
  el: Element | null,
  to: number,
  at: number,
  duration: number,
  format: (n: number) => string = (n) => String(Math.round(n)),
): void {
  if (!el) return;
  const state = { v: 0 };
  el.textContent = format(0);
  tl.to(
    state,
    {
      v: to,
      duration,
      ease: "power1.out",
      onUpdate: () => {
        el.textContent = format(state.v);
      },
    },
    at,
  );
}

/** Fix scroll positions once fonts and images have settled. */
export function refreshOnLoad(): void {
  window.addEventListener("load", () => ScrollTrigger.refresh());
  void document.fonts?.ready.then(() => ScrollTrigger.refresh());
}

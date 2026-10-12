import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { reduced } from "../motion";

gsap.registerPlugin(ScrollTrigger);

type Mode = "paper" | "live";

const TOTAL = 30;
// Which students are stuck, and on what. Same class exercise as the teacher board: the 8 cm × 6 cm rectangle.
const PERIMETER = "(8 + 6) × 2 = 28, the perimeter formula where area was needed";
const ADDED = "8 + 6 = 14, adding where area needs 8 × 6";
const STUCK: Record<number, string> = {
  2: PERIMETER,
  5: ADDED,
  9: PERIMETER,
  13: ADDED,
  17: PERIMETER,
  22: PERIMETER,
  27: ADDED,
};

// Fixed shuffle so the live mode feels like students submitting at different times.
const LIVE_ORDER = [14, 3, 22, 8, 27, 0, 18, 11, 25, 5, 16, 1, 29, 9, 20, 6, 13, 24, 2, 17, 28, 10, 21, 4, 15, 26, 7, 19, 12, 23];

function clockText(mode: Mode, p: number): string {
  if (mode === "paper") {
    const mins = Math.round(p * 24 * 60);
    return `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, "0")}m`;
  }
  const secs = Math.round(p * 5 * 60);
  return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
}

export function initClassroom(): void {
  const root = document.querySelector<HTMLElement>('[data-scene="sim"]');
  const wrap = document.getElementById("dots30");
  const clock = document.getElementById("clock");
  const run = document.getElementById("run") as HTMLButtonElement | null;
  const note = document.getElementById("sim-note");
  const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>(".sim [data-mode]"));
  if (!root || !wrap || !clock || !run || !note) return;

  let mode: Mode = "paper";
  let tween: gsap.core.Tween | null = null;
  let revealed = 0;
  let finished = false;

  const dots: HTMLButtonElement[] = [];
  for (let i = 0; i < TOTAL; i++) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "stu";
    b.addEventListener("click", () => pick(i));
    wrap.appendChild(b);
    dots.push(b);
  }

  const order = (): number[] => (mode === "paper" ? Array.from({ length: TOTAL }, (_, i) => i) : LIVE_ORDER);

  function reset(): void {
    tween?.kill();
    tween = null;
    revealed = 0;
    finished = false;
    dots.forEach((d, i) => {
      d.className = "stu";
      d.setAttribute("aria-label", `Student ${i + 1}, work not checked yet`);
    });
    clock!.textContent = clockText(mode, 0);
    note!.textContent =
      mode === "paper"
        ? "Thirty notebooks to read, one at a time."
        : "Thirty students writing. The board fills in as they hand in.";
  }

  function reveal(upTo: number): void {
    const seq = order();
    while (revealed < upTo) {
      const idx = seq[revealed];
      const issue = STUCK[idx];
      dots[idx].className = issue ? "stu stuck" : "stu ok";
      dots[idx].setAttribute(
        "aria-label",
        issue ? `Student ${idx + 1} wrote ${issue}` : `Student ${idx + 1} is on track`,
      );
      revealed++;
    }
  }

  function pick(i: number): void {
    if (!finished) return;
    const issue = STUCK[i];
    dots.forEach((d) => d.classList.remove("pick"));
    dots[i].classList.add("pick");
    note!.textContent = issue ? `Student ${i + 1} wrote ${issue}.` : `Student ${i + 1} is on track.`;
  }

  function done(): void {
    finished = true;
    const n = Object.keys(STUCK).length;
    note!.textContent =
      mode === "paper"
        ? `${n} students needed help, and the teacher finds out the next day, after the lesson has moved on.`
        : `${n} students flagged in five minutes, while the lesson is still running. Tap a coral student to see the working.`;
  }

  function play(): void {
    reset();
    if (reduced()) {
      reveal(TOTAL);
      clock!.textContent = clockText(mode, 1);
      done();
      return;
    }
    const state = { p: 0 };
    tween = gsap.to(state, {
      p: 1,
      duration: mode === "paper" ? 7 : 1.8,
      ease: mode === "paper" ? "none" : "power2.out",
      onUpdate: () => {
        reveal(Math.floor(state.p * TOTAL));
        clock!.textContent = clockText(mode, state.p);
      },
      onComplete: () => {
        reveal(TOTAL);
        clock!.textContent = clockText(mode, 1);
        done();
      },
    });
  }

  run.addEventListener("click", play);
  tabs.forEach((t) =>
    t.addEventListener("click", () => {
      mode = (t.dataset.mode as Mode) ?? "paper";
      tabs.forEach((x) => x.setAttribute("aria-selected", String(x === t)));
      play();
    }),
  );

  reset();
  // Plays by itself the first time it is on screen.
  ScrollTrigger.create({ trigger: root, start: "top 70%", once: true, onEnter: play });
}

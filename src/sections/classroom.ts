import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { reduced } from "../motion";
import { QUESTIONS, m, type BankError } from "../data/area";

gsap.registerPlugin(ScrollTrigger);

type Mode = "paper" | "live";

const TOTAL = 30;
// The class exercise is question 4M2_T2_Q2 (the 8 cm × 6 cm rectangle), so the mistakes are its two real errors.
const Q2 = QUESTIONS[0];
const PERIM = Q2.errors.find((e) => e.code === "PERIMETER_AREA_CONFUSION") as BankError;
const FORMULA = Q2.errors.find((e) => e.code === "AREA_FORMULA_ERROR") as BankError;
const STUCK: Record<number, BankError> = {
  2: PERIM, 9: PERIM, 17: PERIM, 22: PERIM,
  5: FORMULA, 13: FORMULA, 27: FORMULA,
};

// Fixed shuffle so the dashboard lane feels like students submitting at different times.
const LIVE_ORDER = [14, 3, 22, 8, 27, 0, 18, 11, 25, 5, 16, 1, 29, 9, 20, 6, 13, 24, 2, 17, 28, 10, 21, 4, 15, 26, 7, 19, 12, 23];
const PAPER_ORDER = Array.from({ length: TOTAL }, (_, i) => i);

const DURATION: Record<Mode, number> = { paper: 8, live: 1.8 };

function clockText(mode: Mode, p: number): string {
  if (mode === "paper") {
    const mins = Math.round(p * 24 * 60);
    return `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, "0")}m`;
  }
  const secs = Math.round(p * 5 * 60);
  return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
}

function $(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing #${id}`);
  return el;
}

export function initClassroom(): void {
  const root = document.querySelector<HTMLElement>('[data-scene="sim"]');
  if (!root) return;
  const run = $("run");
  const detail = $("sim-detail");

  interface Lane {
    mode: Mode;
    dots: HTMLButtonElement[];
    clock: HTMLElement;
    note: HTMLElement;
    revealed: number;
    finished: boolean;
    tween: gsap.core.Tween | null;
  }

  const makeLane = (mode: Mode): Lane => {
    const wrap = $(`dots-${mode}`);
    const lane: Lane = { mode, dots: [], clock: $(`clock-${mode}`), note: $(`note-${mode}`), revealed: 0, finished: false, tween: null };
    for (let i = 0; i < TOTAL; i++) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "stu";
      b.addEventListener("click", () => pick(lane, i));
      wrap.appendChild(b);
      lane.dots.push(b);
    }
    return lane;
  };
  const lanes: Lane[] = [makeLane("paper"), makeLane("live")];
  const order = (l: Lane): number[] => (l.mode === "paper" ? PAPER_ORDER : LIVE_ORDER);

  const hint = (): void => {
    detail.innerHTML = `<p class="det__hint">Tap a coral student to see what they wrote, the error, and the idea behind it.</p>`;
  };

  function resetLane(l: Lane): void {
    l.tween?.kill();
    l.tween = null;
    l.revealed = 0;
    l.finished = false;
    l.dots.forEach((d, i) => {
      d.className = "stu";
      d.setAttribute("aria-label", `Student ${i + 1}, work not checked yet`);
    });
    l.clock.textContent = clockText(l.mode, 0);
    l.note.textContent = l.mode === "paper" ? "Reading notebooks one at a time…" : "Watching the board fill in…";
  }

  function reveal(l: Lane, upTo: number): void {
    const seq = order(l);
    while (l.revealed < upTo) {
      const idx = seq[l.revealed];
      const err = STUCK[idx];
      l.dots[idx].className = err ? "stu stuck" : "stu ok";
      l.dots[idx].setAttribute("aria-label", err ? `Student ${idx + 1} needs help. Tap to see why.` : `Student ${idx + 1} is on track`);
      l.revealed++;
    }
  }

  function pick(l: Lane, i: number): void {
    const d = l.dots[i];
    if (!d.classList.contains("stuck") && !d.classList.contains("ok")) return;
    lanes.forEach((x) => x.dots.forEach((y) => y.classList.remove("pick")));
    d.classList.add("pick");
    const err = STUCK[i];
    if (!err) {
      detail.innerHTML = `<p class="det__who"><b>Student ${i + 1}</b> wrote <span class="hwd">8 × 6 = 48 cm<sup>2</sup></span></p><p class="det__ok">On track. No action needed.</p>`;
      return;
    }
    const concept = err.linked ? `${err.linked.code} ${err.linked.name}` : "Square units";
    detail.innerHTML = `
      <div class="det__grid">
        <div class="det__page">
          <p class="mini">Student ${i + 1} wrote</p>
          <div class="det__hand">${err.wrote.map((t) => `<div>${m(t)}</div>`).join("")}<span class="xmark">✗</span></div>
        </div>
        <div class="det__why">
          <p class="mini">Error</p>
          <p class="det__sym m">${m(err.inSymbols)}</p>
          <p class="mini">Weak concept</p>
          <p class="det__gap"><b>${concept}</b></p>
        </div>
      </div>`;
    gsap.fromTo(detail.querySelectorAll(".det__hand div, .det__why > *"), { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.07, clearProps: "opacity,transform" });
    gsap.fromTo(detail.querySelectorAll(".det__hand div"), { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 0.7, stagger: 0.45, ease: "none", clearProps: "clipPath" });
  }

  function finish(l: Lane): void {
    l.finished = true;
    const n = Object.keys(STUCK).length;
    l.note.textContent =
      l.mode === "paper"
        ? `${n} students needed help. The teacher finds out the next day.`
        : `${n} students flagged in five minutes, while the lesson is still running.`;
  }

  function play(): void {
    lanes.forEach(resetLane);
    hint();
    lanes.forEach((l) => {
      if (reduced()) {
        reveal(l, TOTAL);
        l.clock.textContent = clockText(l.mode, 1);
        finish(l);
        return;
      }
      const state = { p: 0 };
      l.tween = gsap.to(state, {
        p: 1,
        duration: DURATION[l.mode],
        ease: l.mode === "paper" ? "none" : "power2.out",
        onUpdate: () => {
          reveal(l, Math.floor(state.p * TOTAL));
          l.clock.textContent = clockText(l.mode, state.p);
        },
        onComplete: () => {
          reveal(l, TOTAL);
          l.clock.textContent = clockText(l.mode, 1);
          finish(l);
        },
      });
    });
  }

  run.addEventListener("click", play);
  lanes.forEach(resetLane);
  hint();
  ScrollTrigger.create({ trigger: root, start: "top 70%", once: true, onEnter: play });
}

export type { Mode };

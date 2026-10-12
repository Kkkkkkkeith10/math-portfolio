import { gsap } from "gsap";
import { reduced } from "../motion";

type Mode = "paper" | "live";

const TOTAL = 30;
// Which students are stuck, and on what. Illustrative.
const STUCK: Record<number, string> = {
  2: "adding fractions with different denominators",
  5: "comparing decimals",
  9: "finding the area of a rectangle",
  13: "adding fractions with different denominators",
  17: "place value in decimals",
  22: "converting between units of length",
  27: "comparing decimals",
};

const NOTE_DEFAULT = "Press “Hand in the work”. Then tap any coral student to see what they got stuck on.";

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
  const wrap = document.getElementById("dots30");
  const clock = document.getElementById("clock");
  const run = document.getElementById("run") as HTMLButtonElement | null;
  const note = document.getElementById("sim-note");
  const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>(".sim [data-mode]"));
  if (!wrap || !clock || !run || !note) return;

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
    run!.disabled = false;
    dots.forEach((d, i) => {
      d.className = "stu";
      d.setAttribute("aria-label", `Student ${i + 1}, work not checked yet`);
    });
    clock!.textContent = clockText(mode, 0);
    note!.textContent = NOTE_DEFAULT;
  }

  function reveal(upTo: number): void {
    const seq = order();
    while (revealed < upTo) {
      const idx = seq[revealed];
      const issue = STUCK[idx];
      dots[idx].className = issue ? "stu stuck" : "stu ok";
      dots[idx].setAttribute(
        "aria-label",
        issue ? `Student ${idx + 1} is stuck on ${issue}` : `Student ${idx + 1} is on track`,
      );
      revealed++;
    }
  }

  function pick(i: number): void {
    if (!finished) return;
    const issue = STUCK[i];
    dots.forEach((d) => d.classList.remove("pick"));
    dots[i].classList.add("pick");
    note!.textContent = issue
      ? `Student ${i + 1} is stuck on ${issue}. (Illustrative.)`
      : `Student ${i + 1} is on track.`;
  }

  function done(): void {
    finished = true;
    run!.disabled = false;
    const n = Object.keys(STUCK).length;
    note!.textContent =
      mode === "paper"
        ? `${n} students needed help, and the teacher finds out the next day, after the lesson has moved on.`
        : `${n} students flagged in five minutes, while the lesson is still running. Tap a coral student to see why.`;
  }

  run.addEventListener("click", () => {
    reset();
    run.disabled = true;
    if (reduced()) {
      reveal(TOTAL);
      clock.textContent = clockText(mode, 1);
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
        clock.textContent = clockText(mode, state.p);
      },
      onComplete: () => {
        reveal(TOTAL);
        clock.textContent = clockText(mode, 1);
        done();
      },
    });
  });

  tabs.forEach((t) =>
    t.addEventListener("click", () => {
      mode = (t.dataset.mode as Mode) ?? "paper";
      tabs.forEach((x) => x.setAttribute("aria-selected", String(x === t)));
      reset();
    }),
  );

  reset();
}

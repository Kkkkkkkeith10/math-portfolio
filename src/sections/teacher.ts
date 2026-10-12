import { gsap } from "gsap";
import { scene } from "../scene";
import { QUESTIONS, m, type BankError } from "../data/area";

const NAMES = [
  "Amy", "Ben", "Chloe", "Dylan", "Emma", "Felix", "Grace", "Henry", "Iris", "Jack",
  "Kelly", "Leo", "Mia", "Noah", "Olivia", "Peter", "Queenie", "Ryan", "Sophie", "Tim",
  "Uma", "Victor", "Wendy", "Xavier", "Yan", "Zoe", "Alan", "Bonnie", "Carl", "Dora",
];

// The class exercise is question 4M2_T2_Q2, so the mistakes are that question's two real errors.
const Q2 = QUESTIONS[0];
const PERIM = Q2.errors.find((e) => e.code === "PERIMETER_AREA_CONFUSION") as BankError;
const FORMULA = Q2.errors.find((e) => e.code === "AREA_FORMULA_ERROR") as BankError;

const STUCK: Record<number, BankError> = {
  2: PERIM, 9: PERIM, 17: PERIM, 22: PERIM,
  5: FORMULA, 13: FORMULA, 27: FORMULA,
};

// Hand-in order, so the board fills at different moments.
const ORDER = [14, 3, 22, 8, 27, 0, 18, 11, 25, 5, 16, 1, 29, 9, 20, 6, 13, 24, 2, 17, 28, 10, 21, 4, 15, 26, 7, 19, 12, 23];

const SHORT: Record<string, string> = {
  PERIMETER_AREA_CONFUSION: "(8+6)×2",
  AREA_FORMULA_ERROR: "8+6",
};

export function initTeacher(): void {
  const grid = document.getElementById("b-grid");
  const chips = document.getElementById("b-chips");
  const detail = document.getElementById("b-detail");
  const subEl = document.getElementById("b-sub");
  const helpEl = document.getElementById("b-help");
  const root = document.querySelector<HTMLElement>('[data-scene="teacher"]');
  if (!grid || !chips || !detail || !subEl || !helpEl || !root) return;
  const detailEl: HTMLElement = detail;
  const tiles: HTMLButtonElement[] = NAMES.map((name, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "tile";
    b.dataset.state = "idle";
    b.dataset.i = String(i);
    b.setAttribute("aria-label", `${name}`);
    const err = STUCK[i];
    b.innerHTML = `<span class="av">${name[0]}</span><span class="nm">${name}</span><span class="st" aria-hidden="true"></span><span class="wk">${err ? SHORT[err.code] : ""}</span>`;
    b.addEventListener("click", () => pickStudent(i));
    grid.appendChild(b);
    return b;
  });

  const groups: { err: BankError; members: number[] }[] = [PERIM, FORMULA].map((err) => ({
    err,
    members: Object.keys(STUCK)
      .map(Number)
      .filter((i) => STUCK[i] === err),
  }));

  const chipEls = groups.map((g) => {
    const c = document.createElement("button");
    c.type = "button";
    c.className = "chip";
    c.setAttribute("aria-pressed", "false");
    c.innerHTML = `<span class="chip__n">0</span><span class="chip__txt"><b class="m">${m(g.err.wrote.join(" "))}</b><small>${g.err.code}</small></span>`;
    c.addEventListener("click", () => pickGroup(g));
    chips.appendChild(c);
    return c;
  });

  const idle = (): void => {
    detailEl.innerHTML = `<p class="det__hint">Tap a student to see their working, or tap a mistake to see who shares it.</p>`;
  };

  function clearFocus(): void {
    tiles.forEach((t) => t.classList.remove("dim", "pick"));
    chipEls.forEach((c) => c.setAttribute("aria-pressed", "false"));
  }

  function pickStudent(i: number): void {
    const t = tiles[i];
    if (t.dataset.state !== "ok" && t.dataset.state !== "stuck") return;
    clearFocus();
    t.classList.add("pick");
    const err = STUCK[i];
    if (!err) {
      detailEl.innerHTML = `<p class="det__who"><b>${NAMES[i]}</b> wrote <span class="hwd">8 × 6 = 48 cm<sup>2</sup></span></p><p class="det__ok">On track. No action needed.</p>`;
      return;
    }
    detailEl.innerHTML = `
      <p class="det__who"><b>${NAMES[i]}</b> wrote <span class="hwd">${m(err.wrote.join("  "))}</span></p>
      <p class="det__row"><span class="tag tag--code">${err.code}</span><span class="tag tag--${err.severity}">${err.severity}</span></p>
      <p class="det__sym m">${m(err.inSymbols)}</p>
      <p class="det__next">Points back to <b>${err.linked ? `${err.linked.code} ${err.linked.name}` : "square units"}</b>. Next: a short challenge on the 8 × 6 rectangle.</p>`;
  }

  function pickGroup(g: { err: BankError; members: number[] }): void {
    clearFocus();
    const idx = groups.indexOf(g);
    chipEls[idx].setAttribute("aria-pressed", "true");
    tiles.forEach((t, i) => t.classList.toggle("dim", !g.members.includes(i)));
    const visible = g.members.filter((i) => tiles[i].dataset.state === "stuck");
    detailEl.innerHTML = `
      <p class="det__who"><b>${visible.length} students</b> share this mistake: ${visible.map((i) => NAMES[i]).join(", ")}</p>
      <p class="det__row"><span class="tag tag--code">${g.err.code}</span><span class="tag tag--${g.err.severity}">${g.err.severity}</span></p>
      <p class="det__sym m">${m(g.err.inSymbols)}</p>
      <p class="det__next">One two-minute mini-lesson covers all ${visible.length}, instead of ${visible.length} separate conversations.</p>`;
  }

  scene(
    root,
    (tl, q) => {
      const finishAt = (i: number): number => 1.2 + ORDER.indexOf(i) * 0.16;
      const total = finishAt(ORDER[ORDER.length - 1]) + 0.4;

      tl.fromTo(q(".tile"), { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.35, stagger: 0.025, ease: "back.out(2)" }, 0);
      tiles.forEach((t, i) => {
        tl.set(t, { attr: { "data-state": "writing" } }, 0.9 + i * 0.01);
        tl.set(t, { attr: { "data-state": STUCK[i] ? "stuck" : "ok" } }, finishAt(i));
      });
      tl.fromTo(q(".chip"), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.15 }, 2.2);

      // Counters follow the timeline clock, so a replay is exact.
      const proxy = { p: 0 };
      tl.to(
        proxy,
        {
          p: 1,
          duration: total,
          ease: "none",
          onUpdate: () => {
            const now = tl.time();
            const done = ORDER.filter((i) => finishAt(i) <= now);
            subEl.textContent = String(done.length);
            helpEl.textContent = String(done.filter((i) => STUCK[i]).length);
            groups.forEach((g, gi) => {
              const n = g.members.filter((i) => done.includes(i)).length;
              const el = chipEls[gi].querySelector(".chip__n");
              if (el) el.textContent = String(n);
            });
          },
        },
        0,
      );
      tl.fromTo(q(".board__detail"), { opacity: 0 }, { opacity: 1, duration: 0.5 }, total);
    },
    () => {
      clearFocus();
      idle();
    },
  );

  idle();
  gsap.set(".board__detail", { opacity: 0 });
}


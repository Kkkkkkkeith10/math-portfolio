import "./knowledge.css";
import { m } from "../data/area";
import { PRIMARY_BANK_COUNTS, AREA_EDGES, AREA_TOPICS, type AreaEdge } from "../data/area-neighborhood";

const roundDown = (n: number): string => `${(Math.floor(n / 1000) * 1000).toLocaleString("en")}+`;

const NODES: Record<string, { x: number; y: number; label: string[] }> = {
  "5M1": { x: 400, y: 50, label: ["Later area"] },
  "4M2": { x: 400, y: 170, label: ["Area"] },
  "4M1": { x: 170, y: 170, label: ["Perimeter"] },
  "4S2": { x: 580, y: 170, label: ["Build", "shapes"] },
  "4S1": { x: 690, y: 170, label: ["Shape", "properties"] },
  "3N2": { x: 130, y: 330, label: ["Multiply"] },
  "3N4": { x: 290, y: 330, label: ["Operations"] },
  "3N3": { x: 450, y: 330, label: ["Divide"] },
  "3S2": { x: 690, y: 330, label: ["Triangles"] },
  "2N5": { x: 100, y: 490, label: ["Add &", "subtract"] },
  "2N6": { x: 240, y: 490, label: ["Equal", "groups"] },
};
const ROWS: [string, number][] = [["G5", 50], ["G4", 170], ["G3", 330], ["G2", 490]];

type State = "g" | "r" | "b";
/** Chains run from the earliest skill (bottom) up to the question. g = understood, r = the gap, b = blocked by the gap. */
const CASES: { code: string; working: string[]; chain: [string, State][]; gap: string }[] = [
  { code: "AREA_FORMULA_ERROR", working: ["8 + 6", "= 14"], chain: [["2N5", "g"], ["3N2", "g"], ["3N4", "g"], ["4M1", "r"], ["4M2", "b"]], gap: "Used the wrong equation. The gap is in <b>perimeter</b>." },
  { code: "PERIMETER_AREA_CONFUSION", working: ["(8 + 6) × 2", "= 28"], chain: [["2N5", "g"], ["3N2", "g"], ["3N4", "g"], ["4M1", "g"], ["4M2", "r"]], gap: "Knows perimeter, but did not apply the new area equation. The gap is <b>area</b>." },
  { code: "AREA_CALCULATION_ERROR", working: ["8 × 6", "= 42"], chain: [["2N5", "g"], ["3N2", "r"], ["3N4", "b"], ["4M2", "b"]], gap: "Right equation, wrong calculation. The gap is <b>multiplication</b>." },
];

const shown = AREA_TOPICS.filter((t) => NODES[t.code]);
const edges = AREA_EDGES.filter((e) => NODES[e.dependent] && NODES[e.foundation]);
const STEP = 0.55;

/** Path from the lower node up to the higher one, so it draws bottom to top. */
function curve(edge: AreaEdge): string {
  let a = NODES[edge.foundation]!;
  let b = NODES[edge.dependent]!;
  if (a.y < b.y) [a, b] = [b, a];
  if (Math.abs(b.y - a.y) < 40) {
    const above = Math.min(a.y, b.y) - 58;
    return `M${a.x} ${a.y} C${a.x} ${above} ${b.x} ${above} ${b.x} ${b.y}`;
  }
  const mid = (a.y + b.y) / 2;
  return `M${a.x} ${a.y} C${a.x} ${mid} ${b.x} ${mid} ${b.x} ${b.y}`;
}

function tree(chain: [string, State][]): string {
  const idx = new Map(chain.map(([c], i) => [c, i]));
  const state = new Map(chain);
  const lit = new Map<AreaEdge, { s: State; i: number }>();
  for (let i = 1; i < chain.length; i += 1) {
    const e = edges.find((x) => (x.dependent === chain[i]![0] && x.foundation === chain[i - 1]![0]) || (x.foundation === chain[i]![0] && x.dependent === chain[i - 1]![0]));
    if (e) lit.set(e, { s: chain[i]![1], i: i - 1 });
  }
  return `<svg class="kg-tree" viewBox="0 0 760 540" aria-hidden="true">
    ${ROWS.map(([g, y]) => `<line class="kg-row" x1="50" x2="760" y1="${y}" y2="${y}"/><text class="kg-grade" x="6" y="${y + 5}">${g}</text>`).join("")}
    ${edges.map((e) => { const l = lit.get(e); return `<path class="kg-branch${l ? ` is-lit kg-${l.s}` : ""}" d="${curve(e)}"${l ? ` pathLength="1" style="--d:${(l.i * STEP + 0.25).toFixed(2)}s"` : ""}/>`; }).join("")}
    ${shown.map((t) => { const n = NODES[t.code]!; const s = state.get(t.code); return `<g class="kg-node${s ? ` is-lit kg-${s}` : ""}"${s ? ` style="--d:${(idx.get(t.code)! * STEP).toFixed(2)}s"` : ""}><circle class="kg-node__ring" cx="${n.x}" cy="${n.y}" r="13"/><circle class="kg-node__core" cx="${n.x}" cy="${n.y}" r="6"/></g>`; }).join("")}
  </svg>
  ${shown.map((t) => { const n = NODES[t.code]!; const s = state.get(t.code); return `<span class="kg-node-label${s ? ` is-lit kg-${s}` : ""}" style="left:${n.x / 7.6}%;top:${n.y / 5.4}%${s ? `;--d:${(idx.get(t.code)! * STEP).toFixed(2)}s` : ""}">${n.label.map((l) => `<span>${m(l)}</span>`).join("")}</span>`; }).join("")}`;
}

export function initKnowledge(): void {
  const root = document.getElementById("knowledge-explorer");
  if (!root) return;
  root.innerHTML = `<div class="kg">
    <div class="kg-cards" role="group" aria-label="Choose a student's answer">
      <p class="kg-question">Question: find the area of an <b>8 cm × 6 cm</b> rectangle.</p>
      ${CASES.map((c, i) => `<button type="button" class="kg-card" data-kg-case="${i}" aria-pressed="${i === 0}"><span class="kg-card__who">Student ${String.fromCharCode(65 + i)}</span><span class="kg-card__work">${c.working.map((l) => `<span>${m(l)}</span>`).join("")}</span><span class="kg-card__x" aria-label="wrong">✗</span></button>`).join("")}
      <p class="kg-correct">Correct: 8 × 6 = 48 cm<sup>2</sup></p>
    </div>
    <div class="kg-tree-card"><div class="kg-tree-frame" id="kg-tree-frame"></div><p class="kg-gap" id="kg-gap" aria-live="polite"></p></div>
  </div>
  <div class="kg-system">
    <h3>Built on the Hong Kong curriculum.</h3>
    <p>Every topic, question and mistake follows the EDB Mathematics Curriculum and Assessment Guide. We built a full system that links each topic to the skills it needs, scaffolds learning from earlier grades up to later ones, and connects every common mistake to the gap behind it.</p>
    <ul><li><b>${PRIMARY_BANK_COUNTS.topics}</b>topics from P1 to P6</li><li><b>${roundDown(PRIMARY_BANK_COUNTS.questions)}</b>questions</li><li><b>${roundDown(PRIMARY_BANK_COUNTS.errorEntries)}</b>catalogued mistakes</li></ul>
  </div>`;

  const frame = root.querySelector<HTMLElement>("#kg-tree-frame")!;
  const gap = root.querySelector<HTMLElement>("#kg-gap")!;

  function select(i: number): void {
    const c = CASES[i]!;
    frame.innerHTML = tree(c.chain);
    gap.innerHTML = c.gap;
    root!.querySelectorAll<HTMLButtonElement>("[data-kg-case]").forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.kgCase) === i)));
    window.dispatchEvent(new CustomEvent("knowledge:error", { detail: { code: c.code, questionId: "4M2_T2_Q2" } }));
  }

  root.addEventListener("click", (event) => {
    const card = (event.target as Element).closest<HTMLButtonElement>("[data-kg-case]");
    if (card) select(Number(card.dataset.kgCase));
  });
  window.addEventListener("knowledge:case", (event) => {
    const index = (event as CustomEvent<{ index?: number }>).detail?.index;
    if (index !== undefined && CASES[index]) select(index);
  });
  select(0);
}

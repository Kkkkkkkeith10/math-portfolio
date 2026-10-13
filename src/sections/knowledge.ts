import "./knowledge.css";
import { m } from "../data/area";
import { PRIMARY_BANK_COUNTS, AREA_EDGES, AREA_TOPICS, type AreaEdge } from "../data/area-neighborhood";

const roundDown = (n: number): string => `${(Math.floor(n / 1000) * 1000).toLocaleString("en")}+`;

/* A shrunk-down copy of the curriculum flow chart: strands are columns, P2 at the top down to P5. */
const BOX_W = 112;
const BOX_H = 58;
const LANE = 132;
const LANE_X = [40, 172, 304, 450, 582];
const ROW_Y: Record<number, number> = { 2: 58, 3: 160, 4: 262, 5: 364 };
const VIEW_W = 700;
const VIEW_H = 428;
const HEADS: [string, number, number][] = [["Number", 0, 3], ["Measures", 3, 2]];
const COLOURS: Record<string, string> = { N: "#2f9e5b", M: "#e08a2c" };
const NODES: Record<string, { lane: number; label: string[] }> = {
  "2N5": { lane: 0, label: ["Add &", "subtract"] },
  "2N6": { lane: 1, label: ["Equal groups"] },
  "3N2": { lane: 0, label: ["Multiply"] },
  "3N4": { lane: 1, label: ["Operations"] },
  "3N3": { lane: 2, label: ["Divide"] },
  "4M1": { lane: 3, label: ["Perimeter"] },
  "4M2": { lane: 4, label: ["Area"] },
  "5M1": { lane: 4, label: ["Later area"] },
};
const box = (code: string): { x: number; y: number } => ({ x: LANE_X[NODES[code]!.lane]!, y: ROW_Y[Number(code[0])]! });

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

/** Right-angle arrow from the earlier skill to the later one, through the gaps between boxes. */
function route(edge: AreaEdge, i: number): string {
  const a = box(edge.foundation);
  const b = box(edge.dependent);
  const bx = b.x + BOX_W / 2 + ((i % 3) - 1) * 12;
  if (a.x === b.x) return `M${bx} ${a.y + BOX_H} V${b.y - 1}`;
  const right = b.x > a.x;
  const ex = right ? a.x + BOX_W : a.x;
  const cx = right ? a.x + BOX_W + (LANE - BOX_W) / 2 : a.x - (LANE - BOX_W) / 2;
  const cy = b.y - 13 + ((i % 3) - 1) * 4;
  return `M${ex} ${a.y + BOX_H / 2} H${cx} V${cy} H${bx} V${b.y - 1}`;
}
const esc = (s: string): string => s.replace(/&/g, "&amp;");

function tree(chain: [string, State][]): string {
  const idx = new Map(chain.map(([c], i) => [c, i]));
  const state = new Map(chain);
  const lit = new Map<AreaEdge, { s: State; i: number }>();
  for (let i = 1; i < chain.length; i += 1) {
    const e = edges.find((x) => (x.dependent === chain[i]![0] && x.foundation === chain[i - 1]![0]) || (x.foundation === chain[i]![0] && x.dependent === chain[i - 1]![0]));
    if (e) lit.set(e, { s: chain[i]![1], i: i - 1 });
  }
  const rules = [3, 4, 5].map((g) => `<line class="kgm-rule" x1="0" x2="${VIEW_W}" y1="${ROW_Y[g]! - 28}" y2="${ROW_Y[g]! - 28}"/>`).join("");
  const grades = [2, 3, 4, 5].map((g) => `<text class="kgm-grade kg-grade" transform="translate(16 ${ROW_Y[g]! + BOX_H / 2}) rotate(-90)">Primary ${g}</text>`).join("");
  const heads = HEADS.map(([name, first, count]) => {
    const w = (count - 1) * LANE + BOX_W;
    return `<rect class="kgm-head" x="${LANE_X[first]}" y="6" width="${w}" height="28"/><text class="kg-strand" x="${LANE_X[first]! + w / 2}" y="25">${name}</text>`;
  }).join("");
  const arrows = edges.map((e, i) => {
    const l = lit.get(e);
    return `<path class="kg-branch${l ? ` is-lit kg-${l.s}` : ""}" d="${route(e, i)}" marker-end="url(#kg-arrow-${l ? l.s : "n"})"${l ? ` pathLength="1" style="--d:${(l.i * STEP + 0.25).toFixed(2)}s"` : ""}/>`;
  }).join("");
  const boxes = shown.map((t) => {
    const p = box(t.code);
    const s = state.get(t.code);
    const name = NODES[t.code]!.label.map((line, n) => `<tspan x="${p.x + 9}" y="${p.y + 37 + n * 15}">${esc(line)}</tspan>`).join("");
    return `<g class="kg-node${s ? ` is-lit kg-${s}` : ""}" style="--c:${COLOURS[t.code[1]!]}${s ? `;--d:${(idx.get(t.code)! * STEP).toFixed(2)}s` : ""}"><rect x="${p.x}" y="${p.y}" width="${BOX_W}" height="${BOX_H}" rx="2"/><text><tspan class="kg-node__code" x="${p.x + 9}" y="${p.y + 19}">${t.code}</tspan>${name}</text></g>`;
  }).join("");
  const marker = (id: string): string => `<marker id="kg-arrow-${id}" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" markerUnits="userSpaceOnUse" orient="auto"><path d="M0 0L8 4L0 8z"/></marker>`;
  return `<svg class="kg-tree" viewBox="0 0 ${VIEW_W} ${VIEW_H}" aria-hidden="true"><defs>${["n", "g", "r", "b"].map(marker).join("")}</defs>${rules}${grades}${heads}${arrows}${boxes}</svg>`;
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
    <figure class="kgx">
      <div class="kgx-stage" id="kgx-stage" role="img" aria-label="A map of every P1 to P6 maths topic by strand and how they link. Drag to look around, tap a topic to see its links."></div>
    </figure>
  </div>`;

  const stage = root.querySelector<HTMLElement>("#kgx-stage")!;
  const graphObserver = new IntersectionObserver((entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    graphObserver.disconnect();
    void import("./knowledge-graph").then(({ mountKnowledgeGraph }) => mountKnowledgeGraph(stage));
  }, { rootMargin: "300px" });
  graphObserver.observe(stage);

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
  select(0);
}

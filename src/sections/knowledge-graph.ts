import graph from "./curriculum-graph.json";

interface Topic { code: string; name: string; grade: number; strand: string; questions: number; errors: number }
interface Link { from: number; to: number; hidden: boolean }

export const STRANDS: Record<string, { name: string; colour: string }> = {
  D: { name: "Data Handling", colour: "#d4507e" },
  N: { name: "Number", colour: "#2f9e5b" },
  A: { name: "Algebra", colour: "#8a5cc9" },
  M: { name: "Measures", colour: "#e08a2c" },
  S: { name: "Shape and Space", colour: "#2f8fc4" },
  E: { name: "Enrichment", colour: "#b3992a" },
  F: { name: "Inquiry", colour: "#6f8a80" },
};
const ORDER = Object.keys(STRANDS);

const topics = graph.topics as Topic[];
const index = new Map(topics.map((t, i) => [t.code, i]));
const links: Link[] = [
  ...(graph.prereq as [string, string][]).map(([a, b]) => ({ from: index.get(a)!, to: index.get(b)!, hidden: false })),
  ...(graph.hidden as [string, string, number][]).map(([a, b]) => ({ from: index.get(a)!, to: index.get(b)!, hidden: true })),
].filter((l) => l.from !== undefined && l.to !== undefined);

/* ---------- Layout, like the EDB flow chart: each strand has a few columns, P1 at the top down to P6 ---------- */
const LANES: Record<string, number> = { D: 1, N: 4, A: 1, M: 3, S: 2, E: 2, F: 1 };
const BOX_W = 150;
const BOX_H = 46;
const LANE_GAP = 40;
const STRAND_GAP = 24;
const ROW_GAP = 24;
const GRADE_GAP = 40;
const LEFT = 48;
const TOP = 70;
const LINE = 13;

function wrap(name: string): string[] {
  if (name.length <= 23) return [name];
  const cut = name.lastIndexOf(" ", 23);
  return [name.slice(0, cut), name.slice(cut + 1)];
}
const lines = topics.map((t) => wrap(t.name));
const boxH = topics.map(() => BOX_H);

/* Each topic goes in the column of the same-strand topic it builds on, so most arrows drop straight down. */
const lanes: number[] = [];
const slots: number[] = [];
for (const s of ORDER) {
  for (let grade = 1; grade <= 6; grade += 1) {
    const stack = new Array<number>(LANES[s]!).fill(0);
    topics.forEach((t, i) => {
      if (t.strand !== s || t.grade !== grade) return;
      const parent = links.find((l) => !l.hidden && l.to === i && topics[l.from]!.strand === s && lanes[l.from] !== undefined);
      const want = parent ? lanes[parent.from]! : -1;
      const free = stack.findIndex((n) => n === 0);
      const lane = want >= 0 && stack[want] === 0 ? want : free >= 0 ? free : want >= 0 ? want : stack.indexOf(Math.min(...stack));
      lanes[i] = lane;
      slots[i] = stack[lane]!;
      stack[lane]! += 1;
    });
  }
}

const strandX = new Map<string, number>();
let x = LEFT;
for (const s of ORDER) { strandX.set(s, x); x += LANES[s]! * (BOX_W + LANE_GAP) + STRAND_GAP; }
const WIDTH = x - STRAND_GAP;
const rowTop = new Map<number, number>();
let y = TOP;
for (let grade = 1; grade <= 6; grade += 1) {
  rowTop.set(grade, y);
  const deepest = Math.max(1, ...topics.map((t, i) => (t.grade === grade ? slots[i]! + 1 : 0)));
  y += deepest * (BOX_H + ROW_GAP) - ROW_GAP + GRADE_GAP;
}
const HEIGHT = y - GRADE_GAP / 2;
const pos = topics.map((t, i) => ({
  x: strandX.get(t.strand)! + LANE_GAP / 2 + lanes[i]! * (BOX_W + LANE_GAP),
  y: rowTop.get(t.grade)! + slots[i]! * (BOX_H + ROW_GAP),
}));

/* Arrows run only through the empty gaps between boxes: out of the side, down a column gap, along the gap above the target. */
const incoming = new Map<number, number>();
function linkPath(l: Link, i: number): string {
  const a = pos[l.from]!;
  const b = pos[l.to]!;
  const k = incoming.get(l.to) ?? 0;
  incoming.set(l.to, k + 1);
  const bx = b.x + BOX_W / 2 + ((k % 5) - 2) * 14;
  const sameLane = a.x === b.x;
  const between = topics.some((_t, j) => pos[j]!.x === a.x && pos[j]!.y > a.y && pos[j]!.y < b.y);
  if (sameLane && b.y > a.y && !between) return `M${bx} ${a.y + BOX_H} V${b.y - 1}`;
  const right = b.x >= a.x;
  const ex = right ? a.x + BOX_W : a.x;
  const cx = right ? a.x + BOX_W + LANE_GAP / 2 + ((i % 5) - 2) * 4 : a.x - LANE_GAP / 2 + ((i % 5) - 2) * 4;
  const cy = b.y - (slots[l.to]! > 0 ? ROW_GAP / 2 : 11) + ((i % 3) - 1) * 3;
  return `M${ex} ${a.y + BOX_H / 2} H${cx} V${cy} H${bx} V${b.y - 1}`;
}

const escape = (s: string): string => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

export function mountKnowledgeGraph(host: HTMLElement): void {
  const rows = [1, 2, 3, 4, 5, 6].map((g) => {
    const top = rowTop.get(g)! - GRADE_GAP / 2;
    const bottom = g === 6 ? HEIGHT : rowTop.get(g + 1)! - GRADE_GAP / 2;
    const mid = (top + bottom) / 2;
    const rule = g > 1 ? `<line class="kgm-rule" x1="0" x2="${WIDTH}" y1="${top}" y2="${top}"/>` : "";
    return `${rule}<text class="kgm-grade" transform="translate(${LEFT / 2 + 4} ${mid}) rotate(-90)">Primary ${g}</text>`;
  }).join("");
  const heads = ORDER.map((s) => {
    const x = strandX.get(s)! + LANE_GAP / 2;
    const w = LANES[s]! * (BOX_W + LANE_GAP) - LANE_GAP;
    return `<rect class="kgm-head" x="${x}" y="14" width="${w}" height="28"/><text class="kgm-strand" x="${x + w / 2}" y="33">${STRANDS[s]!.name}</text>`;
  }).join("");
  const arrow = (id: string): string => `<marker id="${id}" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" markerUnits="userSpaceOnUse" orient="auto"><path d="M0 0L8 4L0 8z"/></marker>`;
  const defs = `<defs>${arrow("kgm-arrow")}${arrow("kgm-arrow-gold")}</defs>`;
  const paths = links.map((l, i) => `<path class="kgm-link${l.hidden ? " is-hidden" : ""}" data-l="${i}" d="${linkPath(l, i)}" marker-end="url(#${l.hidden ? "kgm-arrow-gold" : "kgm-arrow"})"/>`).join("");
  const boxes = topics.map((t, i) => {
    const p = pos[i]!;
    const name = lines[i]!.map((line, n) => `<tspan x="${p.x + 8}" y="${p.y + 30 + n * LINE}">${escape(line)}</tspan>`).join("");
    return `<g class="kgm-topic" data-i="${i}" style="--c:${STRANDS[t.strand]!.colour}"><title>${t.code} ${escape(t.name)}</title><rect x="${p.x}" y="${p.y}" width="${BOX_W}" height="${boxH[i]}" rx="2"/><text><tspan class="kgm-code" x="${p.x + 8}" y="${p.y + 15}">${t.code}</tspan>${name}</text></g>`;
  }).join("");
  host.innerHTML = `<svg class="kgm" viewBox="0 0 ${WIDTH} ${HEIGHT}" preserveAspectRatio="xMidYMid meet">${defs}${rows}${heads}<g class="kgm-links">${paths}</g><g>${boxes}</g></svg>`;
  const svg = host.querySelector<SVGSVGElement>("svg")!;
  const topicEls = Array.from(svg.querySelectorAll<SVGGElement>(".kgm-topic"));
  const linkEls = Array.from(svg.querySelectorAll<SVGPathElement>(".kgm-link"));

  /* ---------- Focus: light up one topic and everything linked to it ---------- */
  let focus: number | null = null;
  function setFocus(next: number | null): void {
    focus = next;
    svg.classList.toggle("is-focused", next !== null);
    const near = new Set<number>();
    links.forEach((l, i) => {
      const on = next !== null && (l.from === next || l.to === next);
      linkEls[i]!.classList.toggle("is-on", on);
      if (on) { near.add(l.from); near.add(l.to); }
    });
    topicEls.forEach((el, i) => {
      el.classList.toggle("is-on", near.has(i));
      el.classList.toggle("is-main", i === next);
    });
  }

  const linked = topics.map((_t, i) => links.filter((l) => l.from === i || l.to === i).length);
  const gold = [...new Set(links.filter((l) => l.hidden).flatMap((l) => [l.from, l.to]))];
  function randomTopic(): number {
    if (Math.random() < 0.4) return gold[Math.floor(Math.random() * gold.length)]!;
    const pool = topics.map((_t, i) => i).filter((i) => linked[i]! >= 2 && i !== focus);
    return pool[Math.floor(Math.random() * pool.length)]!;
  }

  /* ---------- Camera: glide the viewBox between the whole map and one topic's neighbourhood ---------- */
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const view = { x: 0, y: 0, w: WIDTH, h: HEIGHT };
  let manual: typeof view | null = null;
  function wanted(): typeof view {
    if (manual) return manual;
    const aspect = host.clientWidth / Math.max(1, host.clientHeight);
    if (focus === null) return { x: 0, y: 0, w: WIDTH, h: HEIGHT };
    // A fixed zoom on the topic; links that run off the edge still glow on the way out.
    const w = Math.min(WIDTH, aspect < 0.9 ? 400 : 780);
    const h = w / aspect;
    const p = pos[focus]!;
    const clamp = (v: number, size: number, max: number): number => (size >= max ? (max - size) / 2 : Math.max(0, Math.min(max - size, v)));
    return { x: clamp(p.x + BOX_W / 2 - w / 2, w, WIDTH), y: clamp(p.y + boxH[focus]! / 2 - h / 2, h, HEIGHT), w, h };
  }

  let hold = 0;
  let nextSwitch = performance.now() + 3000;
  let frame = 0;
  let last = 0;
  let visible = false;
  function tick(now: number): void {
    frame = 0;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
    last = now;
    if (!reduced.matches && !dragging && now > hold && now > nextSwitch) {
      manual = null;
      if (focus === null) { setFocus(randomTopic()); nextSwitch = now + 5200; }
      else { setFocus(null); nextSwitch = now + 2600; }
    }
    const to = wanted();
    const ease = reduced.matches ? 1 : 1 - Math.exp(-dt * 2.4);
    view.x += (to.x - view.x) * ease;
    view.y += (to.y - view.y) * ease;
    view.w += (to.w - view.w) * ease;
    view.h += (to.h - view.h) * ease;
    svg.setAttribute("viewBox", `${view.x.toFixed(1)} ${view.y.toFixed(1)} ${view.w.toFixed(1)} ${view.h.toFixed(1)}`);
    const settled = Math.abs(to.w - view.w) < 0.5 && Math.abs(to.x - view.x) < 0.5 && Math.abs(to.y - view.y) < 0.5;
    if (visible && !document.hidden && (!reduced.matches || !settled)) frame = requestAnimationFrame(tick);
  }
  const start = (): void => { if (!frame) { last = 0; frame = requestAnimationFrame(tick); } };

  /* ---------- Drag: pan the map by hand; the tour waits until the reader lets go for a while ---------- */
  let dragging = false;
  let moved = 0;
  let from = { x: 0, y: 0 };
  svg.addEventListener("pointerdown", (e) => {
    dragging = true;
    moved = 0;
    from = { x: e.clientX, y: e.clientY };
    manual = { ...view };
    svg.setPointerCapture(e.pointerId);
    svg.classList.add("is-dragging");
  });
  svg.addEventListener("pointermove", (e) => {
    if (!dragging || !manual) return;
    const scale = Math.max(view.w / Math.max(1, host.clientWidth), view.h / Math.max(1, host.clientHeight));
    const dx = e.clientX - from.x;
    const dy = e.clientY - from.y;
    from = { x: e.clientX, y: e.clientY };
    moved += Math.abs(dx) + Math.abs(dy);
    manual.x = Math.max(-manual.w / 2, Math.min(WIDTH - manual.w / 2, manual.x - dx * scale));
    manual.y = Math.max(-manual.h / 2, Math.min(HEIGHT - manual.h / 2, manual.y - dy * scale));
    Object.assign(view, manual);
    start();
  });
  const release = (): void => {
    if (!dragging) return;
    dragging = false;
    svg.classList.remove("is-dragging");
    hold = performance.now() + 10000;
    nextSwitch = hold;
  };
  svg.addEventListener("pointerup", release);
  svg.addEventListener("pointercancel", release);

  /* ---------- Tap: the nearest topic to the tap, so small screens can hit tiny labels ---------- */
  svg.addEventListener("click", (e) => {
    if (moved > 6) return;
    manual = null;
    const point = svg.createSVGPoint();
    point.x = e.clientX;
    point.y = e.clientY;
    const p = point.matrixTransform(svg.getScreenCTM()!.inverse());
    let best = -1;
    let bestDistance = Infinity;
    pos.forEach((q, i) => {
      const dx = Math.max(q.x - p.x, 0, p.x - q.x - BOX_W);
      const dy = Math.max(q.y - p.y, 0, p.y - q.y - boxH[i]!);
      const d = Math.hypot(dx, dy);
      if (d < bestDistance) { bestDistance = d; best = i; }
    });
    const reach = 40 * (view.w / Math.max(1, host.clientWidth));
    setFocus(bestDistance <= reach && best !== focus ? best : null);
    hold = performance.now() + 8000;
    nextSwitch = hold;
    start();
  });

  new IntersectionObserver((entries) => {
    visible = entries.some((e) => e.isIntersecting);
    if (visible) start();
  }).observe(host);
  new ResizeObserver(start).observe(host);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) start(); });
  setFocus(null);
}

import { counter, scene } from "../scene";

const SVG_NS = "http://www.w3.org/2000/svg";

function svg<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | number>,
  parent?: Element,
): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  parent?.appendChild(el);
  return el;
}

const CELL = 20;

/** Draw a rows × cols garden: soil cells, a fence around it, and one plant per square metre. */
function drawPlot(host: HTMLElement | null, cols: number, rows: number): void {
  if (!host) return;
  const w = cols * CELL;
  const h = rows * CELL;
  const el = svg("svg", {
    viewBox: `-4 -4 ${w + 8} ${h + 8}`,
    role: "img",
    "aria-label": `A garden ${cols} metres by ${rows} metres with ${cols * rows} plants`,
  });
  el.style.setProperty("--w", String(w + 8));
  host.appendChild(el);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      svg("rect", { class: "soil", x: c * CELL, y: r * CELL, width: CELL, height: CELL, fill: "#efe3c8", stroke: "#d7c49c", "stroke-width": 1 }, el);
    }
  }
  svg("rect", { class: "fence", x: 0, y: 0, width: w, height: h, fill: "none", stroke: "#b5834f", "stroke-width": 3.5, "stroke-linejoin": "round", pathLength: 1 }, el);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = c * CELL + CELL / 2;
      const cy = r * CELL + CELL / 2;
      const g = svg("g", { class: "pl" }, el);
      svg("path", { d: `M${cx} ${cy + 6}V${cy - 1}`, stroke: "#3c8d4a", "stroke-width": 2, "stroke-linecap": "round", fill: "none" }, g);
      svg("circle", { cx: cx - 3.6, cy: cy - 2.6, r: 3.8, fill: "#4fae5c" }, g);
      svg("circle", { cx: cx + 3.6, cy: cy - 2.6, r: 3.8, fill: "#2f8a43" }, g);
    }
  }
}

function meet(): void {
  scene(document.querySelector<HTMLElement>('[data-scene="meet"]'), (tl, q) => {
    tl.fromTo(q(".skyline, .sun"), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" }, 0);
    // Mei is placed with transform="translate(530 205)", which GSAP reads as x/y, so animate around those values.
    tl.fromTo(q(".mei"), { x: 590, opacity: 0 }, { x: 530, opacity: 1, duration: 0.9, ease: "power3.out" }, 0.3);
    tl.fromTo(q(".fence-line"), { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.4, ease: "power1.inOut" }, 0.5);
    tl.fromTo(q(".posts rect"), { opacity: 0 }, { opacity: 1, duration: 0.4, stagger: 0.12 }, 1.0);
    tl.fromTo(q(".sprouts g"), { scale: 0 }, { scale: 1, duration: 0.5, ease: "back.out(2)", stagger: 0.14 }, 1.5);
    tl.fromTo(q(".sign"), { y: -26, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "bounce.out" }, 1.8);
    tl.fromTo(q(".can"), { rotate: 0 }, { rotate: -16, duration: 0.5, yoyo: true, repeat: 1, ease: "sine.inOut" }, 2.3);

    const bubbles = q(".bubble");
    tl.fromTo(bubbles[0], { y: 22, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 0.55, ease: "back.out(1.6)" }, 0.9);
    tl.fromTo(bubbles[1], { y: 22, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 0.55, ease: "back.out(1.6)" }, 2.6);
    tl.fromTo(bubbles[2], { y: 22, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 0.55, ease: "back.out(1.6)" }, 4.4);
  });
}

function write(): void {
  scene(document.querySelector<HTMLElement>('[data-scene="write"]'), (tl, q) => {
    const lines = q(".hw") as HTMLElement[];
    let t = 0.3;
    lines.forEach((line) => {
      const ink = line.querySelector(".hw__ink");
      const pen = line.querySelector(".pen");
      const len = (ink?.textContent ?? "").length;
      const dur = Math.max(0.7, len * 0.055);
      tl.fromTo(ink, { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: dur, ease: "none" }, t);
      tl.fromTo(pen, { left: "0%" }, { left: "100%", duration: dur, ease: "none" }, t);
      tl.fromTo(pen, { opacity: 0 }, { opacity: 1, duration: 0.01 }, t);
      tl.to(pen, { opacity: 0, duration: 0.2 }, t + dur);
      // Sketch on this row draws while the label is written.
      const sketch = line.parentElement?.querySelector(".draw");
      if (sketch) tl.fromTo(sketch, { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.9, ease: "power1.inOut" }, t + dur * 0.6);
      t += dur + 0.25;
    });

    // Then the page is saved into the notebook.
    tl.fromTo(q(".page--old"), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.15 }, 0.4);
    tl.fromTo(q(".page--new"), { x: -90, y: -50, rotate: -8, opacity: 0, scale: 1.08 }, { x: 0, y: 0, rotate: 0, opacity: 1, scale: 1, duration: 0.9, ease: "power3.out" }, t + 0.1);
    tl.fromTo(q(".page--new em"), { scale: 0 }, { scale: 1, duration: 0.5, ease: "back.out(3)" }, t + 0.8);
    tl.fromTo(q(".why li"), { opacity: 0, x: 12 }, { opacity: 1, x: 0, duration: 0.5, stagger: 0.2 }, t + 0.4);
  });
}

function garden(): void {
  drawPlot(document.querySelector<HTMLElement>("#plotA .plot__draw"), 11, 1);
  drawPlot(document.querySelector<HTMLElement>("#plotB .plot__draw"), 6, 6);

  scene(document.querySelector<HTMLElement>('[data-scene="garden"]'), (tl, q) => {
    tl.fromTo(q(".fence"), { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.1, ease: "power1.inOut" }, 0);
    tl.fromTo(q(".soil"), { opacity: 0 }, { opacity: 1, duration: 0.3, stagger: { each: 0.008, from: "start" } }, 0.2);

    const a = q("#plotA .pl");
    const b = q("#plotB .pl");
    const popA = 0.1;
    const popB = 0.04;
    tl.fromTo(a, { scale: 0 }, { scale: 1, duration: 0.35, ease: "back.out(2.4)", stagger: popA }, 1.3);
    tl.fromTo(b, { scale: 0 }, { scale: 1, duration: 0.35, ease: "back.out(2.4)", stagger: popB }, 1.3);
    counter(tl, document.getElementById("countA"), 11, 1.3, popA * 10 + 0.35);
    counter(tl, document.getElementById("countB"), 36, 1.3, popB * 35 + 0.35);

    tl.fromTo(q(".plot__count"), { opacity: 0 }, { opacity: 1, duration: 0.3 }, 1.2);
    tl.fromTo(q(".plots__verdict"), { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" }, 3.2);
    tl.fromTo(q(".bubble--solo"), { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power3.out" }, 3.5);
    tl.fromTo(q(".find"), { y: 40, rotate: 6, opacity: 0 }, { y: 0, rotate: -2, opacity: 1, duration: 0.8, ease: "back.out(1.5)" }, 4.0);
    tl.to(q(".find"), { boxShadow: "0 0 0 6px rgba(242,193,78,0.55), 0 18px 40px -20px rgba(29,36,51,0.5)", duration: 0.5, yoyo: true, repeat: 1 }, 4.9);
  });
}

export function initStory(): void {
  meet();
  write();
  garden();
}

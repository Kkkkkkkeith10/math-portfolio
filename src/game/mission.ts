import { updateGardenState, type GardenPlan } from "./state";
import type { RooftopHandle } from "./rooftop";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./garden.css";

const FENCE = 24;
const MAX_GARDENS = 3;

interface Reply { label: string; then: () => void }

export function mountMission(container: HTMLElement): { destroy(): void } {
  container.innerHTML = `
  <div class="g" data-phase="meet">
    <div class="g-world">
      <button type="button" class="g-full" id="g-full" aria-pressed="false">⛶ Full screen</button>
      <div id="rooftop-scene" role="group" aria-label="Mei's rooftop garden. Drag the corner handle to change the size of the garden." data-lenis-prevent></div>
      <div class="g-bubble" id="g-bubble" hidden aria-live="polite"><b>Mei</b><p id="g-say"></p><div class="g-replies" id="g-replies"></div></div>
      <div class="g-stack" id="g-stack" hidden aria-live="polite"><div class="g-planks" id="g-planks" aria-hidden="true">${"<i></i>".repeat(FENCE)}</div><p id="g-stack-text"></p></div>
      <div class="g-seeds" id="g-seeds-left" hidden aria-live="polite"><span aria-hidden="true">🌱</span><b id="g-seed-n">0</b><small>left</small></div>
      <div class="g-verdict" id="g-verdict" hidden aria-live="assertive"><span class="g-verdict__mark" id="g-mark"></span><p id="g-verdict-text"></p></div>
      <section class="g-pad" id="g-pad" hidden aria-labelledby="g-pad-q">
        <div class="g-pad__sheet">
          <p class="g-pad__tag">TSA-style question</p>
          <p class="g-pad__q" id="g-pad-q">A farmer has <b>24 m</b> of fence for a rectangular farm. He wants the <b>largest area</b>. How long should each side be?</p>
          <div class="g-pad__work">
            <div class="g-tools" role="group" aria-label="Notepad tools"><button type="button" data-tool="pen" aria-pressed="true">✎ Pen</button><button type="button" data-tool="eraser" aria-pressed="false">Eraser</button><button type="button" id="g-undo">↶ Undo</button></div>
            <svg id="g-board" role="img" aria-label="Notepad: squared paper with the farm. Write your working here." data-lenis-prevent><defs><pattern id="g-grid" patternUnits="userSpaceOnUse" width="20" height="20"><path d="M20 0H0V20" fill="none" stroke="#e2e6dc"/></pattern></defs><rect width="100%" height="100%" fill="url(#g-grid)"/><g id="g-geo"></g><g id="g-ink"></g></svg>
          </div>
          <form class="g-pad__answer" id="g-answer-form"><label for="g-answer">Each side =</label><input id="g-answer" type="number" inputmode="numeric" min="0" placeholder="?"><span>m</span><button type="submit" class="g-btn">Check</button></form>
          <p class="g-pad__result" id="g-result" aria-live="polite"></p>
          <div class="g-pad__foot"><a class="g-btn" href="#error" id="g-real">See real student working ↓</a><button type="button" class="g-link" id="g-restart">Play again</button></div>
        </div>
      </section>
    </div>
  </div>`;

  const root = container.querySelector<HTMLElement>(".g")!;
  const $ = <T extends HTMLElement = HTMLElement>(id: string): T => root.querySelector<T>(`#${id}`)!;
  const world = root.querySelector<HTMLElement>(".g-world")!;
  const board = root.querySelector<SVGSVGElement>("#g-board")!;
  const geo = root.querySelector<SVGGElement>("#g-geo")!;
  const inkLayer = root.querySelector<SVGGElement>("#g-ink")!;
  const controller = new AbortController();
  const on = (el: EventTarget, event: string, fn: EventListener): void => el.addEventListener(event, fn, { signal: controller.signal });

  let scene: RooftopHandle | null = null;
  let destroyed = false;
  let seen = false;
  let started = false;
  let length = 3;
  let width = 2;
  let building = false;
  let awaitingDrag = false;
  let found36 = false;
  const plans: GardenPlan[] = [];
  let ink: number[][][] = [];
  const history: number[][][][] = [];
  let tool: "pen" | "eraser" = "pen";
  let stroke: number[][] | null = null;
  let boardWidth = 600;
  const boardHeight = 260;
  let meiX = 0;
  let meiY = 0;
  let meiFoot = 0;
  const phone = window.matchMedia("(max-width: 560px)");

  const key = (l: number, w: number): string => `${Math.max(l, w)}x${Math.min(l, w)}`;
  const tried = (l: number, w: number): boolean => plans.some((p) => key(p.length, p.width) === key(l, w));
  const fenceUsed = (): number => 2 * (length + width);
  const canDrag = (): boolean => !!scene && !$("rooftop-scene").classList.contains("rooftop-unavailable");

  /* ---------- Mei's speech bubble ---------- */
  function placeBubble(): void {
    const bubble = $("g-bubble");
    if (bubble.hidden) return;
    const w = world.clientWidth;
    const bw = bubble.offsetWidth;
    const bh = bubble.offsetHeight;
    if (phone.matches) {
      // Phones: the bubble comes from Mei's mouth, hangs just below her and points up at her.
      bubble.classList.remove("is-docked");
      bubble.classList.add("is-below");
      const left = Math.max(8, Math.min(w - bw - 8, meiX - bw / 2));
      bubble.style.left = `${left}px`;
      bubble.style.top = `${Math.min(world.clientHeight - bh - 8, meiFoot + 6)}px`;
      bubble.style.setProperty("--tail", `${Math.max(24, Math.min(bw - 24, meiX - left))}px`);
      return;
    }
    bubble.classList.remove("is-below");
    const docked = root.dataset.phase !== "meet";
    bubble.classList.toggle("is-docked", docked);
    if (docked) { bubble.style.left = ""; bubble.style.top = ""; return; }
    bubble.style.left = `${Math.max(12, Math.min(w - bw - 12, meiX - bw + 40))}px`;
    bubble.style.top = `${Math.max(12, meiY - bh - 14)}px`;
  }
  function say(text: string, replies: Reply[] = [], extra?: HTMLElement): void {
    const bubble = $("g-bubble");
    bubble.hidden = false;
    $("g-say").innerHTML = text;
    const box = $("g-replies");
    box.replaceChildren(...replies.map((r) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = r.label;
      b.addEventListener("click", r.then, { once: true });
      return b;
    }));
    if (extra) box.append(extra);
    bubble.classList.remove("pop");
    void bubble.offsetWidth;
    bubble.classList.add("pop");
    scene?.hop();
    placeBubble();
  }
  function setPhase(phase: "meet" | "build" | "done"): void {
    root.dataset.phase = phase;
    placeBubble();
  }

  /* ---------- Opening ---------- */
  function intro(): void {
    if (started || !seen || !scene) return;
    started = true;
    scene.walkIn(() => say("Hi! I'm Auntie Mei. Can you help with my garden?", [{ label: "Sure!", then: check }]));
  }
  function check(): void {
    scene?.showLabels(true);
    scene?.updateGarden(3, 2, true);
    say("Each square grows one plant. How many plants fit in this <b>3 m × 2 m</b> garden?", [
      { label: "5", then: () => say("Count the squares: 3 × 2 = <b>6</b>.", [{ label: "Oh, 6!", then: task }]) },
      { label: "6", then: () => say("Yes! 3 × 2 = <b>6</b>.", [{ label: "Next", then: task }]) },
    ]);
  }
  function task(): void {
    setPhase("build");
    updateGardenState({ phase: "build" });
    length = 3;
    width = 2;
    $("g-stack").hidden = false;
    changed();
    unlock();
  }

  /* ---------- Build: Mei's bubble is the only control ---------- */
  function unlock(): void {
    building = true;
    scene?.setInteractive(true, (l, w) => { if (l === length && w === width) return; length = l; width = w; changed(); });
    hold();
  }
  function lock(): void {
    building = false;
    scene?.setInteractive(false);
  }
  function renderStack(): void {
    const used = fenceUsed();
    const left = FENCE - used;
    scene?.setFenceLeft(Math.max(0, left));
    $("g-planks").querySelectorAll("i").forEach((plank, i) => plank.classList.toggle("is-used", i >= Math.max(0, left)));
    $("g-stack").classList.toggle("is-3d", canDrag());
    $("g-stack").classList.toggle("is-over", left < 0);
    $("g-stack").classList.toggle("is-exact", left === 0);
    $("g-stack-text").innerHTML = left > 0 ? `<b>${left} m</b> of fence left` : left === 0 ? "<b>All 24 m</b> used" : `<b>${-left} m</b> too much`;
  }
  function changed(): void {
    $("g-verdict").hidden = true;
    $("g-seeds-left").hidden = true;
    renderStack();
    scene?.updateGarden(length, width, false);
    if (!building) return;
    const labels = root.querySelectorAll<HTMLElement>(".g-steppers b");
    if (labels[0]) labels[0].textContent = `${length} m`;
    if (labels[1]) labels[1].textContent = `${width} m`;
    // The seed question belongs to one shape. Resizing means they check the fence again.
    if ($("g-replies").querySelector(".g-ask")) hold();
    if (awaitingDrag) showOk();
  }
  function steppers(): HTMLElement {
    const box = document.createElement("div");
    box.className = "g-steppers";
    for (const [axis, label] of [["l", "Length"], ["w", "Width"]] as const) {
      const row = document.createElement("span");
      row.innerHTML = `${label} <button type="button" data-d="-1" aria-label="${label} smaller">−</button><b>${axis === "l" ? length : width} m</b><button type="button" data-d="1" aria-label="${label} bigger">+</button>`;
      row.querySelectorAll<HTMLButtonElement>("button").forEach((b) => b.addEventListener("click", () => {
        const v = Math.max(1, Math.min(11, (axis === "l" ? length : width) + Number(b.dataset.d)));
        if (axis === "l") length = v; else width = v;
        changed();
      }));
      box.append(row);
    }
    return box;
  }
  /** Mei stays quiet while the garden changes. OK appears only after the student drags. */
  function hold(): void {
    awaitingDrag = true;
    const line = found36 ? "Make a garden with more than 36."
      : plans.length === MAX_GARDENS - 1 ? "Try <b>6 m × 6 m</b>."
      : plans.length ? "Try a new shape." : "Help me build a farm with <b>24 m</b> of fence.";
    say(line, [], canDrag() ? undefined : steppers());
  }
  function showOk(): void {
    awaitingDrag = false;
    const box = $("g-replies");
    if (box.querySelector("[data-ok]")) return;
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.ok = "";
    button.textContent = "OK";
    button.addEventListener("click", checkFence, { once: true });
    box.append(button);
  }
  function checkFence(): void {
    const fence = fenceUsed();
    const extra = canDrag() ? undefined : steppers();
    if (fence !== FENCE) {
      awaitingDrag = true;
      say(fence > FENCE ? `That's <b>${fence} m</b>. I only have 24!` : `That's <b>${fence} m</b>. ${FENCE - fence} m of fence is left.`, [], extra);
      return;
    }
    if (tried(length, width)) {
      awaitingDrag = true;
      say(`You tried ${length} × ${width}. Try a new shape.`, [], extra);
      return;
    }
    const goal = found36 ? " More than 36, remember." : "";
    askSeeds(`Nice! <b>${length} m</b> long and <b>${width} m</b> wide is 24 m around. <b>How many plants</b> can I plant?${goal}`, extra);
  }
  function askSeeds(text: string, extra?: HTMLElement): void {
    const form = document.createElement("form");
    form.className = "g-ask";
    form.innerHTML = `<input type="number" inputmode="numeric" min="1" max="121" placeholder="?" aria-label="Number of seeds"><button type="submit">Plant</button>`;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = form.querySelector("input")!;
      const seeds = Number(input.value);
      if (!input.value || !Number.isInteger(seeds) || seeds < 1 || seeds > 121) { input.focus(); return; }
      plant(seeds);
    });
    say(text, [], form);
    if (extra) $("g-replies").prepend(extra);
    if (window.matchMedia("(pointer: fine)").matches) form.querySelector("input")!.focus({ preventScroll: true });
  }

  /* ---------- Plant ---------- */
  function plant(seeds: number): void {
    const area = length * width;
    lock();
    $("g-bubble").hidden = true;
    $("g-verdict").hidden = true;
    const pill = $("g-seeds-left");
    pill.hidden = false;
    pill.classList.remove("is-empty", "is-exact");
    $("g-seed-n").textContent = String(seeds);
    if (!scene) { finish(seeds, Math.min(seeds, area), area); return; }
    scene.plantSeeds(seeds, (planted) => {
      $("g-seed-n").textContent = String(seeds - planted);
      pill.classList.remove("tick");
      void pill.offsetWidth;
      pill.classList.add("tick");
    }, (planted) => finish(seeds, planted, area));
  }
  let verdictTimer = 0;
  function verdict(ok: boolean, text: string): void {
    $("g-mark").textContent = ok ? "✓" : "✗";
    const v = $("g-verdict");
    window.clearTimeout(verdictTimer);
    if (!ok) verdictTimer = window.setTimeout(() => { v.hidden = true; }, 7000);
    v.classList.toggle("is-ok", ok);
    $("g-verdict-text").innerHTML = text;
    v.hidden = false;
    v.classList.remove("pop");
    void v.offsetWidth;
    v.classList.add("pop");
  }
  function finish(seeds: number, planted: number, area: number): void {
    if (destroyed) return;
    const pill = $("g-seeds-left");
    if (seeds !== area) {
      pill.classList.add("is-empty");
      verdict(false, seeds < area ? `Out of seeds! <b>${area - planted}</b> squares are empty.` : `<b>${seeds - area}</b> seeds left over.`);
      building = true;
      scene?.setInteractive(true, (l, w) => { if (l === length && w === width) return; length = l; width = w; changed(); });
      const lead = seeds < area ? `We ran out! It's more than ${seeds}.` : `Too many! It's not ${seeds}.`;
      askSeeds(`${lead} Count the squares: one plant fits in each.`);
      return;
    }
    pill.classList.add("is-exact");
    verdict(true, `<b>${length} × ${width} = ${area}</b> plants`);
    plans.push({ id: Date.now(), length, width, fence: FENCE, area, prediction: seeds, correctPrediction: true, validFence: true, ink: [] });
    updateGardenState({ plans: [...plans] });
    window.setTimeout(() => next(plans[plans.length - 1]!), 1600);
  }

  /* ---------- Guide: at most three gardens ---------- */
  const again = (): void => { $("g-verdict").hidden = true; $("g-seeds-left").hidden = true; unlock(); };
  function next(plan: GardenPlan): void {
    if (destroyed) return;
    $("g-verdict").hidden = true;
    $("g-seeds-left").hidden = true;
    const last = plans.length >= MAX_GARDENS;
    if (plan.area === 36 && !found36) {
      found36 = true;
      if (last) { end(); return; }
      say("<b>36 plants!</b> Can you beat 36?", [{ label: "I'll try", then: again }]);
      return;
    }
    if (last) { end(); return; }
    if (found36) {
      say(`${plan.area} plants. Still not more than 36.`, [{ label: "Try again", then: again }]);
      return;
    }
    if (plans.length === 1) {
      say(`<b>${plan.area} plants!</b> Can we grow more with the same 24 m?`, [{ label: "Try another shape", then: again }]);
      return;
    }
    const prev = plans[plans.length - 2]!;
    const [big, small] = plan.area >= prev.area ? [plan, prev] : [prev, plan];
    const name = (p: GardenPlan): string => `${p.length} × ${p.width}`;
    const hint = (): void => say("Yes! Closer sides, more plants. So try equal sides: <b>6 m × 6 m</b>.", [{ label: "Let's try", then: again }]);
    say(`${name(small)} grew ${small.area}. ${name(big)} grew ${big.area}. Why did ${name(big)} grow more?`, [
      { label: "It has more fence", then: () => say(`Both use 24 m. Look at the sides: ${big.length} and ${big.width}, ${small.length} and ${small.width}.`, [{ label: "Its sides are closer!", then: hint }]) },
      { label: "Its sides are closer", then: hint },
    ]);
  }
  function end(): void {
    setPhase("done");
    updateGardenState({ phase: "complete", plans: [...plans], transferPassed: false });
    lock();
    $("g-stack").hidden = true;
    length = 6;
    width = 6;
    scene?.updateGarden(6, 6, true);
    scene?.setStage("complete");
    const lead = found36 ? "<b>36 is the most!</b>" : "The most is <b>6 × 6 = 36</b>.";
    say(`${lead} With 24 m of fence, length + width is always 12. The closer the two sides, the more plants: 8 × 4 = 32, 7 × 5 = 35, 6 × 6 = 36. So <b>equal sides grow the most</b>.`, [{ label: "Next →", then: openPad }]);
  }

  /* ---------- Notepad: a TSA-style question ---------- */
  function openPad(): void {
    $("g-bubble").hidden = true;
    $("g-pad").hidden = false;
    $<HTMLInputElement>("g-answer").value = "";
    $("g-result").textContent = "";
    $("g-result").className = "g-pad__result";
    requestAnimationFrame(() => { drawBoard(); ScrollTrigger.refresh(); });
  }
  on($("g-answer-form"), "submit", (e) => {
    e.preventDefault();
    const raw = $<HTMLInputElement>("g-answer").value;
    if (!raw) { $("g-answer").focus(); return; }
    const side = Number(raw);
    const ok = side === 6;
    const result = $("g-result");
    result.className = `g-pad__result ${ok ? "is-ok" : "is-wrong"}`;
    result.innerHTML = ok ? "✓ Correct! 6 m × 6 m gives the largest area: <b>36 m²</b>"
      : side === 12 ? "✗ 12 m is length + width together. Split it equally."
      : "✗ Not quite. Length + width = 12. Which sides are equal?";
  });

  function restart(): void {
    plans.length = 0;
    found36 = false;
    ink = [];
    history.length = 0;
    drawInk();
    $("g-pad").hidden = true;
    updateGardenState({ phase: "build", plans: [], activePlan: null, transferPassed: false });
    task();
  }

  /* ---------- Notepad drawing ---------- */
  function svgEl(tag: string, attrs: Record<string, string | number>, parent: Element): SVGElement {
    const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
    parent.appendChild(el);
    return el;
  }
  function drawInk(): void {
    inkLayer.replaceChildren();
    ink.forEach((points) => svgEl("polyline", { points: points.map(([x, y]) => `${x * boardWidth},${y * boardHeight}`).join(" "), class: "g-stroke" }, inkLayer));
  }
  function drawBoard(): void {
    const w = board.parentElement?.clientWidth ?? 0;
    if (w > 0) boardWidth = w;
    board.setAttribute("viewBox", `0 0 ${boardWidth} ${boardHeight}`);
    geo.replaceChildren();
    const x = 40, y = 40, gw = 160, gh = 120;
    svgEl("rect", { x, y, width: gw, height: gh, class: "g-board-plot" }, geo);
    svgEl("text", { x: x + gw / 2, y: y - 12, "text-anchor": "middle" }, geo).textContent = "? m";
    svgEl("text", { x: x + gw + 10, y: y + gh / 2 + 5 }, geo).textContent = "? m";
    svgEl("text", { x, y: y + gh + 26, class: "g-board-note" }, geo).textContent = "Fence = 24 m";
    drawInk();
  }
  function point(e: PointerEvent): [number, number] {
    const p = board.createSVGPoint();
    p.x = e.clientX;
    p.y = e.clientY;
    const q = p.matrixTransform(board.getScreenCTM()!.inverse());
    return [q.x, q.y];
  }
  on(board, "pointerdown", (event) => {
    const e = event as PointerEvent;
    e.preventDefault();
    history.push(structuredClone(ink));
    board.setPointerCapture(e.pointerId);
    const [x, y] = point(e);
    if (tool === "pen") {
      stroke = [[x / boardWidth, y / boardHeight]];
      ink.push(stroke);
    } else {
      const hit = ink.findIndex((pts) => pts.some(([px, py]) => Math.hypot(px * boardWidth - x, py * boardHeight - y) < 18));
      if (hit >= 0) ink.splice(hit, 1);
    }
    drawInk();
  });
  on(board, "pointermove", (event) => {
    if (!stroke) return;
    const [x, y] = point(event as PointerEvent);
    if (stroke.length < 1200) stroke.push([x / boardWidth, y / boardHeight]);
    drawInk();
  });
  const endStroke = (): void => { stroke = null; };
  on(board, "pointerup", endStroke);
  on(board, "pointercancel", endStroke);
  root.querySelectorAll<HTMLButtonElement>("[data-tool]").forEach((b) => on(b, "click", () => {
    tool = b.dataset.tool as "pen" | "eraser";
    root.querySelectorAll("[data-tool]").forEach((el) => el.setAttribute("aria-pressed", String(el === b)));
  }));
  on($("g-undo"), "click", () => { const last = history.pop(); if (last) { ink = last; drawInk(); } });

  /* ---------- Wiring ---------- */
  on($("g-restart"), "click", restart);
  on($("g-full"), "click", () => {
    if (document.fullscreenElement === root) void document.exitFullscreen().catch(() => undefined);
    else void root.requestFullscreen?.().catch(() => undefined);
  });
  on(document, "fullscreenchange", () => {
    const active = document.fullscreenElement === root;
    $("g-full").setAttribute("aria-pressed", String(active));
    $("g-full").textContent = active ? "⛶ Exit full screen" : "⛶ Full screen";
    requestAnimationFrame(() => { drawBoard(); placeBubble(); ScrollTrigger.refresh(); });
  });
  on(root, "click", (event) => {
    if ((event.target as Element).closest('a[href^="#"]') && document.fullscreenElement === root) void document.exitFullscreen().catch(() => undefined);
  });

  const seenObserver = new IntersectionObserver((entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    seen = true;
    seenObserver.disconnect();
    intro();
  }, { threshold: 0.45 });
  seenObserver.observe(world);
  const resize = new ResizeObserver(() => { if (!$("g-pad").hidden) drawBoard(); placeBubble(); });
  resize.observe(world);

  setPhase("meet");
  renderStack();

  void import("./rooftop").then(({ mountRooftop }) => {
    if (destroyed) return;
    scene = mountRooftop($("rooftop-scene"));
    scene.updateGarden(length, width, false);
    scene.setFenceLeft(FENCE - fenceUsed());
    scene.setStage("meet");
    scene.onMeiMove((x, y, foot) => { meiX = x; meiY = y; meiFoot = foot; placeBubble(); });
    intro();
  }).catch(() => {
    if (destroyed) return;
    $("rooftop-scene").innerHTML = '<img class="rooftop-poster" src="/img/rooftop-low-poly.webp" alt="Mei\'s rooftop garden">';
    seen = true;
    started = true;
    say("Hi! I'm Auntie Mei. Can you help with my garden?", [{ label: "Sure!", then: check }]);
  });

  return {
    destroy() {
      destroyed = true;
      controller.abort();
      seenObserver.disconnect();
      resize.disconnect();
      scene?.destroy();
      container.replaceChildren();
    },
  };
}

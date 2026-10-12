import { updateGardenState, type GardenPlan } from "./state";
import type { RooftopHandle } from "./rooftop";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./garden.css";

const FENCE = 24;

interface Reply { label: string; then: () => void }

export function mountMission(container: HTMLElement): { destroy(): void } {
  container.innerHTML = `
  <div class="g" data-phase="meet">
    <div class="g-layout">
      <div class="g-world">
        <button type="button" class="g-full" id="g-full" aria-pressed="false">⛶ Full screen</button>
        <div id="rooftop-scene" role="group" aria-label="Mei's rooftop garden. Drag the round handles to change the size of the garden." data-lenis-prevent></div>
        <div class="g-bubble" id="g-bubble" hidden aria-live="polite"><b>Mei</b><p id="g-say"></p><div class="g-replies" id="g-replies"></div></div>
        <div class="g-slot" id="g-slot" hidden aria-live="polite"><span class="g-slot__icon" aria-hidden="true"><i></i><i></i><i></i></span><b id="g-slot-n">0</b><small>seeds left</small></div>
        <div class="g-verdict" id="g-verdict" hidden aria-live="assertive"><span class="g-verdict__mark" id="g-mark"></span><p id="g-verdict-text"></p></div>
        <details class="g-notebook" id="g-notebook" hidden><summary>✎ My notebook</summary>
          <div class="g-board-wrap"><div class="g-tools" role="group" aria-label="Notebook tools"><button type="button" data-tool="pen" aria-pressed="true">✎ Pen</button><button type="button" data-tool="eraser" aria-pressed="false">Eraser</button><button type="button" id="g-undo">↶ Undo</button></div>
          <svg id="g-board" role="img" aria-label="Your notebook: the garden drawn on squared paper, with your own writing" data-lenis-prevent><defs><pattern id="g-grid" patternUnits="userSpaceOnUse"><path id="g-grid-path" fill="none"/></pattern></defs><rect width="100%" height="100%" fill="url(#g-grid)"/><g id="g-geo"></g><g id="g-ink"></g></svg>
          <p class="g-board-foot">Each square is 1 m². Write your working here.</p></div>
        </details>
        <section class="g-done" id="g-done" hidden>
          <div class="g-find"><span>Your first Find</span><b>Same fence,<br>different space.</b><small>Perimeter is the edge. Area is the space inside.</small></div>
          <div><h3>You found it!</h3><p id="g-done-text"></p><a class="g-btn" href="#error">See how MathsAI spots mistakes ↓</a><button type="button" class="g-link" id="g-restart">Play again</button></div>
        </section>
      </div>
      <aside class="g-panel" id="g-panel" hidden>
        <p class="g-plan" id="g-plan">Plan A</p>
        <div class="g-field">
          <p class="g-label"><b>1</b> Shape your garden</p>
          <label for="g-len">Length <output id="g-len-out">8 m</output></label><input id="g-len" type="range" min="1" max="11" value="8">
          <label for="g-wid">Width <output id="g-wid-out">3 m</output></label><input id="g-wid" type="range" min="1" max="11" value="3">
          <div class="g-fence"><span>Fence used</span><b id="g-fence">22 / 24 m</b></div>
          <div class="g-track"><i id="g-fence-fill"></i></div>
          <p class="g-fence-note" id="g-fence-note"></p>
        </div>
        <div class="g-field">
          <p class="g-label"><b>2</b> How many seeds will fit?</p>
          <div class="g-guess"><input id="g-seeds" type="number" inputmode="numeric" min="1" max="121" placeholder="?" aria-label="Number of seeds"><span>seeds</span></div>
          <button type="button" class="g-btn" id="g-plant">Plant the seeds</button>
        </div>
        <ul class="g-saved" id="g-saved" aria-label="Your plans"></ul>
      </aside>
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
  let length = 8;
  let width = 3;
  let busy = false;
  const plans: GardenPlan[] = [];
  let ink: number[][][] = [];
  const history: number[][][][] = [];
  let tool: "pen" | "eraser" = "pen";
  let stroke: number[][] | null = null;
  let boardWidth = 520;
  let meiX = 0;
  let meiY = 0;

  /* ---------- Mei's speech bubble ---------- */
  function placeBubble(): void {
    const bubble = $("g-bubble");
    if (bubble.hidden) return;
    const docked = root.dataset.phase !== "meet";
    bubble.classList.toggle("is-docked", docked);
    if (docked) { bubble.style.left = ""; bubble.style.top = ""; return; }
    const w = world.clientWidth;
    const bw = bubble.offsetWidth;
    const bh = bubble.offsetHeight;
    const left = Math.max(12, Math.min(w - bw - 12, meiX - bw + 40));
    const top = Math.max(12, meiY - bh - 14);
    bubble.style.left = `${left}px`;
    bubble.style.top = `${top}px`;
  }
  function say(text: string, replies: Reply[] = []): void {
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
    bubble.classList.remove("pop");
    void bubble.offsetWidth;
    bubble.classList.add("pop");
    scene?.hop();
    placeBubble();
  }

  /* ---------- The opening conversation ---------- */
  function intro(): void {
    if (started || !seen || !scene) return;
    started = true;
    scene.walkIn(() => {
      say("Hi! I'm Auntie Mei. Can you help me with my rooftop garden?", [{ label: "Sure! What do you need?", then: rules }]);
    });
  }
  function rules(): void {
    say("I have <b>24 m of fence</b>. Every <b>1 m × 1 m square</b> inside the fence grows <b>one plant</b>.", [{ label: "Got it", then: check }]);
  }
  function check(): void {
    say("Quick check: a garden is <b>3 m long</b> and <b>2 m wide</b>. How many plants fit?", [
      { label: "5", then: () => say("Not quite. 3 + 2 = 5 adds the sides. Count the squares: 3 × 2 = <b>6</b>.", [{ label: "Oh, 6!", then: task }]) },
      { label: "6", then: () => say("Yes! 3 rows of 2 squares: 3 × 2 = <b>6</b> plants.", [{ label: "Easy", then: task }]) },
    ]);
  }
  function task(): void {
    say("Your task: build a garden that uses <b>all 24 m</b> of fence. Then tell me <b>how many seeds</b> to plant.", [{ label: "I'm on it!", then: build }]);
  }

  /* ---------- Build and plant ---------- */
  function setStep(step: "meet" | "build" | "more" | "done"): void {
    root.dataset.phase = step;
    const order = ["meet", "build", "more"];
    root.querySelectorAll<HTMLElement>("[data-step]").forEach((li) => {
      const i = order.indexOf(li.dataset.step!);
      const now = step === "done" ? 3 : order.indexOf(step);
      li.classList.toggle("is-done", i < now);
      if (i === now) li.setAttribute("aria-current", "step");
      else li.removeAttribute("aria-current");
    });
  }
  function build(): void {
    setStep("build");
    updateGardenState({ phase: "build" });
    $("g-panel").hidden = false;
    $("g-notebook").hidden = false;
    scene?.setStage("build");
    unlock();
    say("Drag the round handles, or use the sliders. Use exactly 24 m of fence.");
    requestAnimationFrame(() => { drawBoard(); ScrollTrigger.refresh(); });
  }
  function unlock(): void {
    busy = false;
    for (const id of ["g-len", "g-wid", "g-seeds", "g-plant"]) $<HTMLInputElement>(id).disabled = false;
    scene?.setInteractive(true, (l, w) => { if (l === length && w === width) return; length = l; width = w; changed(); });
  }
  function lock(): void {
    busy = true;
    for (const id of ["g-len", "g-wid", "g-seeds", "g-plant"]) $<HTMLInputElement>(id).disabled = true;
    scene?.setInteractive(false);
  }
  const fenceUsed = (): number => 2 * (length + width);
  function renderShape(): void {
    const fence = fenceUsed();
    $("g-len-out").textContent = `${length} m`;
    $("g-wid-out").textContent = `${width} m`;
    $<HTMLInputElement>("g-len").value = String(length);
    $<HTMLInputElement>("g-wid").value = String(width);
    $("g-fence").textContent = `${fence} / ${FENCE} m`;
    const fill = $("g-fence-fill");
    fill.style.width = `${Math.min(1, fence / FENCE) * 100}%`;
    fill.classList.toggle("is-over", fence > FENCE);
    fill.classList.toggle("is-exact", fence === FENCE);
    $("g-fence-note").textContent = fence === FENCE ? "✓ All 24 m used" : fence > FENCE ? `${fence - FENCE} m too much` : `${FENCE - fence} m of fence left`;
    drawBoard();
  }
  function changed(): void {
    $("g-verdict").hidden = true;
    $("g-slot").hidden = true;
    renderShape();
    scene?.updateGarden(length, width, false);
  }

  function plant(): void {
    if (busy) return;
    const fence = fenceUsed();
    if (fence !== FENCE) {
      say(fence > FENCE ? `That needs ${fence} m of fence. I only have 24 m!` : `You still have ${FENCE - fence} m of fence left. Use all 24 m.`);
      return;
    }
    const value = $<HTMLInputElement>("g-seeds").value;
    const seeds = Number(value);
    if (!value || !Number.isInteger(seeds) || seeds < 1 || seeds > 121) {
      say("How many seeds? Type a number first.");
      $("g-seeds").focus({ preventScroll: true });
      return;
    }
    const area = length * width;
    lock();
    $("g-verdict").hidden = true;
    const slot = $("g-slot");
    const count = $("g-slot-n");
    slot.hidden = false;
    slot.classList.remove("is-empty", "is-exact");
    count.textContent = String(seeds);
    $("g-bubble").hidden = true;
    scene?.plantSeeds(seeds, (planted) => {
      count.textContent = String(seeds - planted);
      slot.classList.remove("tick");
      void slot.offsetWidth;
      slot.classList.add("tick");
      if (seeds - planted === 0) slot.classList.add("is-empty");
    }, (planted) => finish(seeds, planted, area));
  }

  function verdict(ok: boolean, text: string): void {
    $("g-mark").textContent = ok ? "✓" : "✗";
    $("g-verdict").classList.toggle("is-ok", ok);
    $("g-verdict-text").innerHTML = text;
    const v = $("g-verdict");
    v.hidden = false;
    v.classList.remove("pop");
    void v.offsetWidth;
    v.classList.add("pop");
  }

  function finish(seeds: number, planted: number, area: number): void {
    if (seeds < area) {
      verdict(false, `Out of seeds!<br><b>${area - planted} squares</b> are still empty.`);
      say(`We ran out! It's more than ${seeds}. Count the squares again.`);
      unlock();
      return;
    }
    if (seeds > area) {
      verdict(false, `The garden is full,<br>but <b>${seeds - area} seeds</b> are left over.`);
      say(`Too many seeds! It's not ${seeds}. Count the squares again.`);
      unlock();
      return;
    }
    $("g-slot").classList.replace("is-empty", "is-exact");
    verdict(true, `Exactly right!<br><b>${length} × ${width} = ${area}</b> plants`);
    const plan: GardenPlan = { id: Date.now(), length, width, fence: FENCE, area, prediction: seeds, correctPrediction: true, validFence: true, ink: structuredClone(ink) };
    plans.push(plan);
    renderSaved();
    window.setTimeout(() => next(plan), 1700);
  }

  function next(plan: GardenPlan): void {
    if (destroyed) return;
    const best = Math.max(...plans.slice(0, -1).map((p) => p.area), 0);
    if (plans.length === 1) {
      if (plan.area === 36) { complete(); return; }
      say(`${plan.area} plants! Now, can you use the <b>same 24 m</b> to grow <b>more than ${plan.area}</b>?`, [{ label: "Let's try!", then: () => {
        setStep("more");
        $("g-plan").textContent = "Plan B";
        $<HTMLInputElement>("g-seeds").value = "";
        $("g-verdict").hidden = true;
        $("g-slot").hidden = true;
        unlock();
        say("Change the shape. Keep all 24 m of fence.");
      } }]);
      return;
    }
    if (plan.area > best) { complete(); return; }
    say(`That's ${plan.area}, but your first garden grew ${best}. Try a different shape!`);
    $<HTMLInputElement>("g-seeds").value = "";
    unlock();
  }

  function complete(): void {
    setStep("done");
    updateGardenState({ phase: "complete", plans: [...plans] });
    lock();
    $("g-panel").hidden = true;
    $("g-notebook").hidden = true;
    $("g-slot").hidden = true;
    $("g-verdict").hidden = true;
    scene?.setStage("complete");
    const lines = plans.map((p, i) => `Plan ${String.fromCharCode(65 + i)}: ${p.length} × ${p.width} = <b>${p.area} plants</b>`).join(" &nbsp;·&nbsp; ");
    $("g-done-text").innerHTML = `${lines}<br>The same 24 m of fence can hold a different number of plants.`;
    $("g-done").hidden = false;
    say("Same fence, more plants. You found it!");
    requestAnimationFrame(() => ScrollTrigger.refresh());
  }

  function renderSaved(): void {
    $("g-saved").innerHTML = plans.map((p, i) => `<li><b>Plan ${String.fromCharCode(65 + i)}</b> ${p.length} × ${p.width} m <em>${p.area} plants ✓</em></li>`).join("");
  }

  function restart(): void {
    plans.length = 0;
    renderSaved();
    length = 8;
    width = 3;
    ink = [];
    history.length = 0;
    $<HTMLInputElement>("g-seeds").value = "";
    $("g-plan").textContent = "Plan A";
    $("g-done").hidden = true;
    changed();
    build();
  }

  /* ---------- Notebook ---------- */
  function svgEl(tag: string, attrs: Record<string, string | number>, parent: Element): SVGElement {
    const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
    parent.appendChild(el);
    return el;
  }
  function drawInk(): void {
    inkLayer.replaceChildren();
    ink.forEach((points) => svgEl("polyline", { points: points.map(([x, y]) => `${x * boardWidth},${y * 320}`).join(" "), class: "g-stroke" }, inkLayer));
  }
  function drawBoard(): void {
    const w = board.parentElement?.clientWidth ?? 0;
    if (w > 0) boardWidth = w;
    const unit = Math.min(26, (boardWidth - 80) / 11);
    board.setAttribute("viewBox", `0 0 ${boardWidth} 320`);
    const pattern = root.querySelector("#g-grid")!;
    for (const [k, v] of Object.entries({ width: unit, height: unit, x: 40, y: 30 })) pattern.setAttribute(k, String(v));
    root.querySelector("#g-grid-path")!.setAttribute("d", `M${unit} 0H0V${unit}`);
    geo.replaceChildren();
    const x = 40, y = 30, gw = length * unit, gh = width * unit;
    svgEl("rect", { x, y, width: gw, height: gh, class: "g-board-plot" }, geo);
    svgEl("text", { x: x + gw / 2, y: y - 10, "text-anchor": "middle" }, geo).textContent = `${length} m`;
    svgEl("text", { x: x + gw + 10, y: y + gh / 2 + 4 }, geo).textContent = `${width} m`;
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
      stroke = [[x / boardWidth, y / 320]];
      ink.push(stroke);
    } else {
      const hit = ink.findIndex((pts) => pts.some(([px, py]) => Math.hypot(px * boardWidth - x, py * 320 - y) < 18));
      if (hit >= 0) ink.splice(hit, 1);
    }
    drawInk();
  });
  on(board, "pointermove", (event) => {
    if (!stroke) return;
    const [x, y] = point(event as PointerEvent);
    if (stroke.length < 1200) stroke.push([x / boardWidth, y / 320]);
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
  on($("g-notebook"), "toggle", () => requestAnimationFrame(drawBoard));

  /* ---------- Wiring ---------- */
  for (const [id, key] of [["g-len", "length"], ["g-wid", "width"]] as const) {
    on($(id), "input", () => {
      const v = Number($<HTMLInputElement>(id).value);
      if (key === "length") length = v; else width = v;
      changed();
    });
  }
  on($("g-seeds"), "keydown", (e) => { if ((e as KeyboardEvent).key === "Enter") plant(); });
  on($("g-plant"), "click", plant);
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
  const resize = new ResizeObserver(() => { drawBoard(); placeBubble(); });
  resize.observe(world);

  setStep("meet");
  renderShape();
  for (const id of ["g-len", "g-wid", "g-seeds", "g-plant"]) $<HTMLInputElement>(id).disabled = true;

  void import("./rooftop").then(({ mountRooftop }) => {
    if (destroyed) return;
    scene = mountRooftop($("rooftop-scene"));
    scene.updateGarden(length, width, false);
    scene.setStage("meet");
    scene.onMeiMove((x, y) => { meiX = x; meiY = y; placeBubble(); });
    intro();
  }).catch(() => {
    if (destroyed) return;
    $("rooftop-scene").innerHTML = '<img class="rooftop-poster" src="/img/rooftop-low-poly.webp" alt="Mei\'s rooftop garden">';
    seen = true;
    started = true;
    say("Hi! I'm Auntie Mei. Can you help me with my rooftop garden?", [{ label: "Sure! What do you need?", then: rules }]);
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

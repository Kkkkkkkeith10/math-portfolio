import { updateGardenState, type GardenPlan } from "./state";
import type { RooftopHandle } from "./rooftop";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./garden.css";

const FARM_FENCE = 12;

interface Reply { label: string; then: () => void }

export function mountMission(container: HTMLElement): { destroy(): void } {
  container.innerHTML = `
  <div class="g" data-phase="meet">
    <div class="g-world">
      <button type="button" class="g-full" id="g-full" aria-pressed="false">⛶ Full screen</button>
      <div id="rooftop-scene" role="group" aria-label="Auntie Mei's rooftop. Draw a fence line to build each farm." data-lenis-prevent></div>
      <div class="g-bubble" id="g-bubble" hidden aria-live="polite"><b>Mei</b><p id="g-say"></p><div class="g-replies" id="g-replies"></div></div>
      <div class="g-stack" id="g-stack" hidden aria-live="polite"><div class="g-planks" id="g-planks" aria-hidden="true">${"<i></i>".repeat(FARM_FENCE)}</div><p id="g-stack-text"></p></div>
      <div class="g-verdict" id="g-verdict" hidden aria-live="assertive"><span class="g-verdict__mark" id="g-mark"></span><p id="g-verdict-text"></p></div>
      <section class="g-compare" id="g-compare" hidden aria-label="Compare the three farms">
        <p class="g-compare__prompt">Order the areas from <b>smallest</b> to <b>largest</b>, with the largest on the right.</p>
        <div class="g-compare__row" id="g-compare-row"></div>
        <button type="button" class="g-btn" id="g-compare-check">Check order</button>
        <p class="g-compare__result" id="g-compare-result" aria-live="polite"></p>
      </section>
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
  const plans: GardenPlan[] = [];
  const farms: { length: number; width: number }[] = [];
  let cardHandles: { destroy(): void }[] = [];
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
  const tried = (l: number, w: number): boolean => farms.some((f) => key(f.length, f.width) === key(l, w));
  const canDraw = (): boolean => !!scene && scene.canDraw();

  /* ---------- Mei's speech bubble ---------- */
  function placeBubble(): void {
    const bubble = $("g-bubble");
    if (bubble.hidden) return;
    const w = world.clientWidth;
    const bw = bubble.offsetWidth;
    const bh = bubble.offsetHeight;
    if (root.dataset.phase !== "meet") {
      // Mei stands on the left of the plot, so the bubble hangs above her and reaches left, away from the farm.
      bubble.classList.remove("is-below");
      bubble.classList.add("is-tail");
      const left = Math.max(8, Math.min(w - bw - 8, meiX - bw + 44));
      bubble.style.left = `${left}px`;
      bubble.style.top = `${Math.max(8, meiY - bh - 16)}px`;
      bubble.style.setProperty("--tail", `${Math.max(24, Math.min(bw - 24, meiX - left))}px`);
      return;
    }
    bubble.classList.remove("is-tail");
    if (phone.matches) {
      // Phones: the bubble comes from Mei's mouth, hangs just below her and points up at her.
      bubble.classList.add("is-below");
      const left = Math.max(8, Math.min(w - bw - 8, meiX - bw / 2));
      bubble.style.left = `${left}px`;
      bubble.style.top = `${Math.min(world.clientHeight - bh - 8, meiFoot + 6)}px`;
      bubble.style.setProperty("--tail", `${Math.max(24, Math.min(bw - 24, meiX - left))}px`);
      return;
    }
    bubble.classList.remove("is-below");
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

  /* ---------- Opening: teach perimeter, then area, on a fixed 3 m x 2 m plot ---------- */
  function intro(): void {
    if (started || !seen || !scene) return;
    started = true;
    scene.walkIn(() => say("Hi! I'm Auntie Mei. Can you help with my garden?", [{ label: "Sure!", then: askPerimeter }]));
  }
  function askPerimeter(): void {
    scene?.showLabels(true);
    scene?.updateGarden(3, 2, false);
    say("This plot is <b>3 m</b> long and <b>2 m</b> wide. What's the fence all the way around it?", [
      { label: "5 m", then: () => say("5 only counts two sides. The fence has four: (3 + 2) × 2 = <b>10 m</b>.", [{ label: "Oh I see", then: askArea }]) },
      { label: "10 m", then: () => say("Yes! (3 + 2) × 2 = <b>10 m</b>.", [{ label: "Next", then: askArea }]) },
    ]);
  }
  function askArea(): void {
    scene?.updateGarden(3, 2, true);
    say("Each square grows one plant. How many plants fit inside?", [
      { label: "5", then: () => say("Count the squares: 3 × 2 = <b>6</b>.", [{ label: "Oh, 6!", then: task }]) },
      { label: "6", then: () => say("Yes! 3 × 2 = <b>6</b>.", [{ label: "Next", then: task }]) },
    ]);
  }
  function task(): void {
    setPhase("build");
    updateGardenState({ phase: "build" });
    scene?.showLabels(false);
    scene?.setStage("build");
    startFarm(0);
  }

  /* ---------- Build: draw three farms, one at a time, each with exactly 12 m of fence ---------- */
  function renderFenceText(left: number): void {
    $("g-planks").querySelectorAll("i").forEach((plank, i) => plank.classList.toggle("is-used", i >= Math.max(0, left)));
    $("g-stack").classList.toggle("is-3d", canDraw());
    $("g-stack").classList.toggle("is-over", left < 0);
    $("g-stack").classList.toggle("is-exact", left === 0);
    $("g-stack-text").innerHTML = left > 0 ? `<b>${left} m</b> of fence left` : left === 0 ? "<b>All 12 m</b> used" : `<b>${-left} m</b> too much`;
  }
  const leadFor = (index: number): string => index === 0
    ? "Let's build <b>3 farms</b>, each using all <b>12 m</b> of my fence. First, drag the gold handle along the dotted line. Drag back to rub out; turn a corner to start a new side."
    : index === 1
      ? "There are <b>2 more</b> combinations that use all <b>12 m</b> of my fence. Can you find one?"
      : "There's <b>1 more</b> combination that uses all <b>12 m</b>. Can you find it?";

  function startFarm(index: number): void {
    $("g-verdict").hidden = true;
    for (let i = 0; i < index; i += 1) scene?.setFarmGrey(i, true);
    scene?.setFenceLeft(FARM_FENCE);
    scene?.focusFarm(index);
    scene?.walkToFarm(index, () => {
      $("g-stack").hidden = false;
      renderFenceText(FARM_FENCE);
      say(leadFor(index), []);
      beginDrawing(index);
    });
  }
  function beginDrawing(index: number): void {
    if (!canDraw()) { manualDraw(index); return; }
    scene!.beginDraw(index, {
      guide: index === 0 ? { length: 4, width: 2 } : null,
      onChange: (drawn) => renderFenceText(FARM_FENCE - drawn),
      onClose: (l, w) => {
        $("g-bubble").hidden = true;
        scene!.buildFence(index, () => judgeFarm(index, l, w));
      },
    });
  }
  function tryAgain(index: number): void {
    scene?.clearFarm(index);
    renderFenceText(FARM_FENCE);
    say(leadFor(index), []);
    window.setTimeout(() => { if (!destroyed) beginDrawing(index); }, 350);
  }
  /** Every fence is built first; only then does Mei say whether it works. */
  function judgeFarm(index: number, l: number, w: number): void {
    if (destroyed) return;
    const fence = 2 * (l + w);
    const again = [{ label: "Try again", then: () => tryAgain(index) }];
    if (fence > FARM_FENCE) {
      say(`That needs <b>${fence} m</b> of fence, but I only have <b>12 m</b>. Think about the perimeter again: 2 × (L + W) = 2 × (${l} + ${w}) = <b>${fence} m</b>.`, again);
      return;
    }
    if (fence < FARM_FENCE) {
      say(`That only uses <b>${fence} m</b>. We still have <b>${FARM_FENCE - fence} m</b> of fence left. Make use of it too!`, again);
      return;
    }
    if (index === 0 && key(l, w) !== key(4, 2)) {
      say("That uses all 12 m! But for this first farm, follow the dotted line.", again);
      return;
    }
    if (tried(l, w)) {
      say(`You've already built a <b>${l} × ${w}</b> farm. Find a different one.`, again);
      return;
    }
    onFarmDrawn(index, l, w);
  }
  function manualDraw(index: number): void {
    let l = 1;
    let w = 1;
    const wrap = document.createElement("div");
    wrap.className = "g-steppers";
    const row = (label: string, get: () => number, set: (v: number) => void): HTMLElement => {
      const span = document.createElement("span");
      const paint = (): void => {
        span.innerHTML = `${label} <button type="button" data-d="-1" aria-label="${label} smaller">−</button><b>${get()} m</b><button type="button" data-d="1" aria-label="${label} bigger">+</button>`;
        span.querySelectorAll<HTMLButtonElement>("button").forEach((b) => b.addEventListener("click", () => {
          set(Math.max(1, Math.min(9, get() + Number(b.dataset.d))));
          paint();
          renderFenceText(FARM_FENCE - 2 * (l + w));
        }));
      };
      paint();
      return span;
    };
    wrap.append(row("Length", () => l, (v) => { l = v; }), row("Width", () => w, (v) => { w = v; }));
    const confirm = document.createElement("button");
    confirm.type = "button";
    confirm.className = "g-btn";
    confirm.textContent = "Draw this farm";
    confirm.addEventListener("click", () => judgeFarm(index, l, w));
    wrap.append(confirm);
    renderFenceText(FARM_FENCE - 2 * (l + w));
    say(`${leadFor(index)} Set the length and width.`, [], wrap);
  }
  function onFarmDrawn(index: number, l: number, w: number): void {
    farms[index] = { length: l, width: w };
    $("g-bubble").hidden = true;
    const celebrate = (): void => {
      if (destroyed) return;
      verdict(true, `Farm ${index + 1}: all <b>12 m</b> of fence used`);
      window.setTimeout(() => {
        if (destroyed) return;
        $("g-verdict").hidden = true;
        if (index < 2) { startFarm(index + 1); return; }
        $("g-stack").hidden = true;
        allDrawn();
      }, 1500);
    };
    if (scene) scene.settleFarm(index, celebrate);
    else celebrate();
  }
  function allDrawn(): void {
    for (let i = 0; i < 3; i += 1) scene?.setFarmGrey(i, false);
    scene?.focusFarm(null);
    say("Nice! Let's have a look at which one has the biggest area.", [{ label: "Let's look", then: () => areaFarm(0) }]);
  }

  /* ---------- Area: visit each farm, grow it and count the plants ---------- */
  function areaFarm(index: number): void {
    $("g-bubble").hidden = true;
    $("g-verdict").hidden = true;
    for (let i = 0; i < 3; i += 1) scene?.setFarmGrey(i, i !== index);
    scene?.focusFarm(index);
    const { length: l, width: w } = farms[index]!;
    const grow = (): void => {
      if (scene) scene.growFarm(index, () => askPlantCount(index, l, w));
      else askPlantCount(index, l, w);
    };
    if (scene) scene.walkToFarm(index, grow);
    else grow();
  }
  function askPlantCount(index: number, l: number, w: number): void {
    askCount(`Count the plants, or calculate <b>${l} × ${w}</b>. How many fit?`, (answer) => checkCount(index, l, w, answer));
  }
  function askCount(text: string, onSubmit: (value: number) => void): void {
    const form = document.createElement("form");
    form.className = "g-ask";
    form.innerHTML = `<input type="number" inputmode="numeric" min="1" max="121" placeholder="?" aria-label="Number of plants"><button type="submit">Check</button>`;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = form.querySelector("input")!;
      const value = Number(input.value);
      if (!input.value || !Number.isInteger(value) || value < 1 || value > 121) { input.focus(); return; }
      onSubmit(value);
    });
    say(text, [], form);
    if (window.matchMedia("(pointer: fine)").matches) form.querySelector("input")!.focus({ preventScroll: true });
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
  function checkCount(index: number, l: number, w: number, answer: number): void {
    if (destroyed) return;
    const area = l * w;
    if (answer !== area) {
      verdict(false, answer < area ? `More than ${answer}.` : `Not ${answer}.`);
      askPlantCount(index, l, w);
      return;
    }
    verdict(true, `<b>${l} × ${w} = ${area}</b> plants`);
    const plan: GardenPlan = { id: Date.now() + index, length: l, width: w, fence: FARM_FENCE, area, prediction: answer, correctPrediction: true, validFence: true, ink: [] };
    plans.push(plan);
    updateGardenState({ plans: [...plans] });
    window.setTimeout(() => afterFarm(index, plan), 1400);
  }
  function afterFarm(index: number, plan: GardenPlan): void {
    if (destroyed) return;
    $("g-verdict").hidden = true;
    if (index < 2) say(`<b>${plan.area} plants!</b> On to the next farm.`, [{ label: "Next farm", then: () => areaFarm(index + 1) }]);
    else say(`<b>${plan.area} plants!</b> Let's compare all three.`, [{ label: "Compare", then: openCompare }]);
  }

  /* ---------- Compare: drag the three 3D cards to swap places, smallest to largest ---------- */
  const cards = (): HTMLElement[] => Array.from(root.querySelectorAll<HTMLElement>("#g-compare-row .g-card"));
  let picked: HTMLElement | null = null;
  function openCompare(): void {
    $("g-bubble").hidden = true;
    for (let i = 0; i < 3; i += 1) scene?.setFarmGrey(i, false);
    scene?.setStage("compare");
    const row = $("g-compare-row");
    row.replaceChildren();
    picked = null;
    const order = [...plans].sort(() => Math.random() - 0.5);
    order.forEach((plan, i) => {
      if (i > 0) {
        const sign = document.createElement("span");
        sign.className = "g-compare__sign";
        sign.setAttribute("aria-label", "is smaller than");
        sign.textContent = "<";
        row.append(sign);
      }
      const card = document.createElement("div");
      card.className = "g-card";
      card.tabIndex = 0;
      card.dataset.id = String(plan.id);
      card.innerHTML = `<div class="g-card__scene" aria-label="A ${plan.length} by ${plan.width} metre farm. Drag sideways to turn it."></div><p class="g-card__area">${plan.length} × ${plan.width} = ${plan.area}</p>`;
      row.append(card);
      wireCard(card);
      void import("./rooftop").then(({ mountFarmCard }) => {
        if (destroyed) return;
        const host = card.querySelector<HTMLElement>(".g-card__scene");
        if (host) cardHandles.push(mountFarmCard(host, plan.length, plan.width));
      });
    });
    clearResult();
    $("g-compare").hidden = false;
    requestAnimationFrame(() => ScrollTrigger.refresh());
  }
  function cardAt(x: number, y: number, except: HTMLElement): HTMLElement | null {
    for (const card of cards()) {
      if (card === except) continue;
      const r = card.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return card;
    }
    return null;
  }
  function swap(a: HTMLElement, b: HTMLElement): void {
    if (a === b) return;
    const mark = document.createElement("span");
    a.replaceWith(mark);
    b.replaceWith(a);
    mark.replaceWith(b);
    clearResult();
  }
  function pick(card: HTMLElement | null): void {
    picked?.classList.remove("is-picked");
    picked = card === picked ? null : card;
    picked?.classList.add("is-picked");
  }
  function wireCard(card: HTMLElement): void {
    let pointerId: number | null = null;
    let startX = 0;
    let startY = 0;
    let lifted = false;
    const signal = controller.signal;
    card.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      pointerId = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      lifted = false;
      card.setPointerCapture(e.pointerId);
    }, { signal });
    card.addEventListener("pointermove", (e) => {
      if (e.pointerId !== pointerId) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (!lifted && Math.hypot(dx, dy) < 6) return;
      lifted = true;
      pick(null);
      card.classList.add("is-lifted");
      card.style.transform = `translate(${dx}px, ${dy}px) rotate(-2deg)`;
      const over = cardAt(e.clientX, e.clientY, card);
      cards().forEach((other) => other.classList.toggle("is-over", other === over));
    }, { signal });
    const end = (e: PointerEvent): void => {
      if (e.pointerId !== pointerId) return;
      pointerId = null;
      if (card.hasPointerCapture(e.pointerId)) card.releasePointerCapture(e.pointerId);
      card.classList.remove("is-lifted");
      card.style.transform = "";
      cards().forEach((other) => other.classList.remove("is-over"));
      if (e.type !== "pointerup") return;
      if (!lifted) {
        // Tap one card, then another, to swap them.
        if (picked && picked !== card) { const first = picked; pick(null); swap(first, card); }
        else pick(card);
        return;
      }
      const target = cardAt(e.clientX, e.clientY, card);
      if (target) swap(card, target);
    };
    card.addEventListener("pointerup", end, { signal });
    card.addEventListener("pointercancel", end, { signal });
    card.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      if (picked && picked !== card) { const first = picked; pick(null); swap(first, card); card.focus(); }
      else pick(card);
    }, { signal });
  }
  function clearResult(): void {
    $("g-compare-result").textContent = "";
    $("g-compare-result").className = "g-compare__result";
  }
  on($("g-compare-check"), "click", () => {
    const areas = cards().map((card) => plans.find((p) => p.id === Number(card.dataset.id))?.area ?? 0);
    const correct = areas.every((a, i) => i === 0 || areas[i - 1]! <= a);
    const result = $("g-compare-result");
    if (correct) {
      result.className = "g-compare__result is-ok";
      result.textContent = "✓ Smallest to largest!";
      $("g-compare-row").classList.add("is-solved");
      window.setTimeout(showRule, 1200);
    } else {
      result.className = "g-compare__result is-wrong";
      result.textContent = "Not quite. Compare the areas, then swap the cards.";
    }
  });
  function showRule(): void {
    $("g-compare").hidden = true;
    $("g-compare-row").classList.remove("is-solved");
    cardHandles.forEach((h) => h.destroy());
    cardHandles = [];
    setPhase("done");
    updateGardenState({ phase: "complete", plans: [...plans], transferPassed: false });
    scene?.setStage("complete");
    const best = [...plans].sort((a, b) => b.area - a.area)[0]!;
    const worst = [...plans].sort((a, b) => a.area - b.area)[0]!;
    say(`The closer the two sides, the bigger the area \u2014 and the further apart, the smaller. <b>${best.length} × ${best.width} = ${best.area}</b> beats <b>${worst.length} × ${worst.width} = ${worst.area}</b>.`, [{ label: "Next →", then: openPad }]);
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
    farms.length = 0;
    cardHandles.forEach((h) => h.destroy());
    cardHandles = [];
    scene?.resetFarms();
    ink = [];
    history.length = 0;
    drawInk();
    $("g-pad").hidden = true;
    $("g-compare").hidden = true;
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

  void import("./rooftop").then(({ mountRooftop }) => {
    if (destroyed) return;
    scene = mountRooftop($("rooftop-scene"));
    scene.setStage("meet");
    scene.onMeiMove((x, y, foot) => { meiX = x; meiY = y; meiFoot = foot; placeBubble(); });
    intro();
  }).catch(() => {
    if (destroyed) return;
    $("rooftop-scene").innerHTML = '<img class="rooftop-poster" src="/img/rooftop-low-poly.webp" alt="Mei\'s rooftop garden">';
    seen = true;
    started = true;
    say("Hi! I'm Auntie Mei. Can you help with my garden?", [{ label: "Sure!", then: askArea }]);
  });

  return {
    destroy() {
      destroyed = true;
      controller.abort();
      seenObserver.disconnect();
      resize.disconnect();
      cardHandles.forEach((h) => h.destroy());
      scene?.destroy();
      container.replaceChildren();
    },
  };
}

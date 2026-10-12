import "./learning-flow.css";
import { QUESTIONS, m } from "../data/area";
import type { BankError } from "../data/area";

const question = QUESTIONS[0];
const perimeterError = question.errors[0];
const additionError = question.errors[1];
const help: Record<number, BankError> = {
  2: perimeterError, 9: perimeterError, 17: perimeterError, 22: perimeterError,
  5: additionError, 13: additionError, 27: additionError,
};
const liveOrder = [14, 3, 22, 8, 27, 0, 18, 11, 25, 5, 16, 1, 29, 9, 20, 6, 13, 24, 2, 17, 28, 10, 21, 4, 15, 26, 7, 19, 12, 23];

function initTeacher(host: HTMLElement): void {
  type Mode = "manual" | "live";
  interface Lane { mode: Mode; dots: HTMLButtonElement[]; clock: HTMLElement; note: HTMLElement; order: number[]; revealed: number; duration: number; }
  host.innerHTML = `
    <div class="lf-comparison">
      <button class="lf-replay" id="lf-sim-replay" type="button">↻ Replay</button>
      <div class="lf-lanes">${(["manual", "live"] as Mode[]).map((mode) => `
        <article class="lf-lane lf-lane--${mode}">
          <div class="lf-lane__head"><h3>${mode === "manual" ? "Marking by hand" : "MathsAI"}</h3><b class="lf-clock" id="lf-${mode}-clock">${mode === "manual" ? "0h 00m" : "0:00"}</b></div>
          <div class="lf-pupils" id="lf-${mode}-pupils" role="group" aria-label="${mode === "manual" ? "Marking by hand" : "MathsAI"}: 30 students">${Array.from({ length: 30 }, (_, i) => `<button type="button" class="lf-pupil" aria-label="Student ${i + 1}: not checked yet" disabled></button>`).join("")}</div>
          <p class="lf-lane__note" id="lf-${mode}-note"></p>
        </article>`).join("")}</div>
      <div class="lf-feedback" id="lf-feedback-details" aria-live="polite"><p class="lf-feedback__hint">Tap a red dot to see what that student wrote.</p></div>
    </div>`;

  const root = host.querySelector<HTMLElement>(".lf-comparison")!;
  const detail = host.querySelector<HTMLElement>("#lf-feedback-details")!;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const lanes: Lane[] = (["manual", "live"] as Mode[]).map((mode) => ({
    mode,
    dots: Array.from(host.querySelectorAll<HTMLButtonElement>(`#lf-${mode}-pupils button`)),
    clock: host.querySelector<HTMLElement>(`#lf-${mode}-clock`)!,
    note: host.querySelector<HTMLElement>(`#lf-${mode}-note`)!,
    order: mode === "manual" ? Array.from({ length: 30 }, (_, i) => i) : liveOrder,
    revealed: 0,
    duration: mode === "manual" ? 8 : 1.8,
  }));
  let elapsed = 0;
  let visible = false;
  let running = false;
  let timer: number | null = null;
  let elapsedAtStart = 0;
  let startedAt = 0;
  let selected: number | null = null;

  function pick(index: number, announce = true): void {
    selected = index;
    const error = help[index];
    detail.innerHTML = error
      ? `<div class="lf-handwriting">${error.wrote.map((line) => `<span>${m(line)}</span>`).join("")}<i aria-label="wrong">✗</i></div><p class="lf-feedback__line">Teacher identify student in need, immediately.</p>`
      : `<div class="lf-handwriting lf-handwriting--ok">${question.correct.map((line) => `<span>${m(line)}</span>`).join("")}<i aria-label="correct">✓</i></div><p class="lf-feedback__line">Correct. This student can move on.</p>`;
    lanes.forEach((lane) => lane.dots.forEach((dot, i) => { dot.classList.toggle("is-selected", i === index && !dot.disabled); dot.setAttribute("aria-pressed", String(i === index && !dot.disabled)); }));
    if (error && announce) window.dispatchEvent(new CustomEvent("knowledge:error", { detail: { code: error.code, questionId: question.id } }));
  }

  function render(): void {
    lanes.forEach((lane) => {
      const progress = reduced.matches ? 1 : Math.min(1, elapsed / lane.duration);
      const target = Math.floor(progress * 30);
      while (lane.revealed < target) {
        const pupil = lane.order[lane.revealed++];
        const dot = lane.dots[pupil];
        dot.disabled = false;
        dot.classList.add(help[pupil] ? "needs-help" : "matches");
        dot.classList.toggle("is-selected", pupil === selected);
        dot.setAttribute("aria-pressed", String(pupil === selected));
        dot.setAttribute("aria-label", `Student ${pupil + 1}: ${help[pupil] ? "needs help. Tap to see their working" : "correct"}`);
      }
      if (lane.mode === "manual") {
        const minutes = Math.round(progress * 24 * 60);
        lane.clock.textContent = progress === 1 ? "Next day" : `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}m`;
      } else {
        const seconds = Math.round(progress * 5 * 60);
        lane.clock.textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
      }
      lane.note.textContent = progress < 1 ? "" : lane.mode === "manual" ? "The teacher finds out the next day." : "The teacher sees who needs help during the lesson.";
    });
    if (selected === null && lanes[1].revealed === 30) pick(2, false);
  }

  function stop(): void {
    if (running) elapsed = Math.min(8, elapsedAtStart + (performance.now() - startedAt) / 1000);
    if (timer !== null) window.clearInterval(timer);
    running = false;
    timer = null;
    render();
  }
  function start(): void {
    if (running || !visible || document.hidden || elapsed >= 8 || reduced.matches) return;
    running = true;
    startedAt = performance.now();
    elapsedAtStart = elapsed;
    timer = window.setInterval(() => {
      elapsed = Math.min(8, elapsedAtStart + (performance.now() - startedAt) / 1000);
      render();
      if (elapsed >= 8) stop();
    }, 50);
  }
  function replay(): void {
    stop();
    elapsed = reduced.matches ? 8 : 0;
    selected = null;
    lanes.forEach((lane) => {
      lane.revealed = 0;
      lane.dots.forEach((dot, i) => {
        dot.className = "lf-pupil";
        dot.disabled = true;
        dot.setAttribute("aria-pressed", "false");
        dot.setAttribute("aria-label", `Student ${i + 1}: not checked yet`);
      });
    });
    detail.innerHTML = `<p class="lf-feedback__hint">Tap a red dot to see what that student wrote.</p>`;
    render();
    start();
  }
  lanes.forEach((lane) => lane.dots.forEach((dot, i) => dot.addEventListener("click", () => pick(i))));
  host.querySelector<HTMLButtonElement>("#lf-sim-replay")!.addEventListener("click", replay);
  const observer = new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    if (visible) start(); else stop();
  }, { threshold: .12 });
  observer.observe(root);
  document.addEventListener("visibilitychange", () => { if (document.hidden) stop(); else start(); });
  reduced.addEventListener("change", replay);
  render();
}

interface Step { cols: number; rows: number; right: number; wrong: number; hint: string }
interface Profile { style: "rows" | "fence"; unit: string; ok: (s: Step) => string; prompt: (s: Step) => string; who: string; wrote: string; gapSkill: string; skills: { name: string; level: number }[]; steps: Step[] }

const PROFILES: Record<string, Profile> = {
  AREA_FORMULA_ERROR: {
    style: "fence", unit: "m", prompt: () => "The fence goes all the way around the garden. How long is the fence?",
    who: "A", wrote: "8 + 6 = 14", gapSkill: "Perimeter", ok: (s) => `(${s.cols} + ${s.rows}) × 2 = ${s.right}`,
    skills: [{ name: "Add & subtract", level: 90 }, { name: "Multiply", level: 85 }, { name: "Perimeter", level: 30 }, { name: "Area", level: 45 }],
    steps: [
      { cols: 4, rows: 3, right: 14, wrong: 7, hint: "4 + 3 = 7 counts only two sides. The fence has four: (4 + 3) × 2 = 14." },
      { cols: 6, rows: 4, right: 20, wrong: 10, hint: "6 + 4 = 10 is half the way round. Double it: (6 + 4) × 2 = 20." },
      { cols: 8, rows: 6, right: 28, wrong: 14, hint: "8 + 6 = 14 is half the way round. Double it: (8 + 6) × 2 = 28." },
    ],
  },
  PERIMETER_AREA_CONFUSION: {
    style: "fence", unit: "m²", prompt: () => "Each tile is 1 m². Use the area equation: how much space is INSIDE the fence?",
    who: "B", wrote: "(8 + 6) × 2 = 28", gapSkill: "Area", ok: (s) => `${s.cols} × ${s.rows} = ${s.right}`,
    skills: [{ name: "Add & subtract", level: 90 }, { name: "Multiply", level: 85 }, { name: "Perimeter", level: 85 }, { name: "Area", level: 30 }],
    steps: [
      { cols: 4, rows: 3, right: 12, wrong: 14, hint: "14 m is the fence around it. Area = 4 × 3 = 12 squares inside." },
      { cols: 5, rows: 2, right: 10, wrong: 14, hint: "14 m is the fence again. The space inside is 5 × 2 = 10." },
      { cols: 8, rows: 6, right: 48, wrong: 28, hint: "28 m is the fence. The space inside is 8 × 6 = 48." },
    ],
  },
  AREA_CALCULATION_ERROR: {
    style: "rows", unit: "tiles", prompt: (s) => `There are ${s.rows} rows of ${s.cols} tiles. How many tiles in all?`,
    who: "C", wrote: "8 × 6 = 42", gapSkill: "Multiply", ok: (s) => `${s.cols} × ${s.rows} = ${s.right}`,
    skills: [{ name: "Add & subtract", level: 90 }, { name: "Multiply", level: 30 }, { name: "Perimeter", level: 85 }, { name: "Area", level: 45 }],
    steps: [
      { cols: 4, rows: 3, right: 12, wrong: 13, hint: "Close, but 4 × 3 = 12. Count the rows: 4 + 4 + 4 = 12." },
      { cols: 6, rows: 5, right: 30, wrong: 35, hint: "5 rows of 6: 6 + 6 + 6 + 6 + 6 = 30." },
      { cols: 8, rows: 6, right: 48, wrong: 42, hint: "6 rows of 8: 8 × 6 = 48, not 42." },
    ],
  },
};
function tiles(step: Step, style: "rows" | "fence"): string {
  const size = Math.min(150 / step.cols, 90 / step.rows);
  const w = size * step.cols;
  const h = size * step.rows;
  const x0 = (200 - w) / 2;
  const y0 = 12;
  let cells = "";
  for (let r = 0; r < step.rows; r += 1) {
    for (let c = 0; c < step.cols; c += 1) cells += `<rect class="lf-tile${style === "rows" && r % 2 === 0 ? " is-alt" : ""}" style="--i:${r * step.cols + c}" x="${x0 + c * size}" y="${y0 + r * size}" width="${size}" height="${size}"/>`;
  }
  let extra = `<rect class="lf-plot" x="${x0}" y="${y0}" width="${w}" height="${h}"/>`;
  if (style === "rows") {
    for (let r = 0; r < step.rows; r += 1) extra += `<text class="lf-rowlabel" x="${x0 - 6}" y="${y0 + (r + .5) * size + 3}" style="text-anchor:end">${r + 1}</text>`;
    extra += `<text x="100" y="${y0 + h + 18}">${step.rows} equal rows · ${step.cols} tiles in each row</text>`;
  } else {
    extra += `<rect class="lf-fence" x="${x0 - 4}" y="${y0 - 4}" width="${w + 8}" height="${h + 8}"/>`;
    for (const [px, py] of [[x0 - 4, y0 - 4], [x0 + w + 4, y0 - 4], [x0 - 4, y0 + h + 4], [x0 + w + 4, y0 + h + 4]]) extra += `<circle class="lf-post" cx="${px}" cy="${py}" r="3"/>`;
    extra += `<text x="100" y="${y0 + h + 22}">fence: ${step.cols} m by ${step.rows} m</text>`;
  }
  return `<svg class="lf-question-diagram lf-diagram--${style}" viewBox="0 0 200 ${h + 44}" role="img" aria-label="A ${step.cols} m by ${step.rows} m garden made of 1 m² tiles">${cells}${extra}</svg>`;
}

function initChallenge(host: HTMLElement): void {
  host.innerHTML = `
    <div class="lf-adapt">
      <article class="lf-profile" aria-live="polite">
        <header><span class="lf-avatar" id="lf-avatar">A</span><div><b id="lf-who">Student A</b><small>Learning profile</small></div>
          <div class="lf-switch" role="group" aria-label="Choose a student">${Object.entries(PROFILES).map(([code, p]) => `<button type="button" data-lf-student="${code}">${p.who}</button>`).join("")}</div></header>
        <p class="lf-profile__last">Last answer: <span id="lf-wrote"></span> <i>✗</i></p>
        <ul class="lf-skills" id="lf-skills"></ul>
        <p class="lf-profile__note">Every answer updates this profile.</p>
      </article>
      <article class="lf-quick-question">
        <header class="lf-quick-head"><span id="lf-made-for">Made for Student A</span><span class="lf-levels" id="lf-levels" aria-label="Difficulty"></span></header>
        <p class="lf-quick-prompt" id="lf-prompt"><b></b></p>
        <div id="lf-diagram"></div>
        <div class="lf-quick-answers" id="lf-answers" role="group" aria-label="Choose the area"></div>
        <p class="lf-answer-feedback" id="lf-answer-feedback" aria-live="polite"></p>
        <button type="button" class="lf-next" id="lf-next" hidden></button>
      </article>
    </div>`;

  const $ = (id: string): HTMLElement => host.querySelector<HTMLElement>(`#${id}`)!;
  let code = "AREA_FORMULA_ERROR";
  let profile = PROFILES[code]!;
  let levels: Record<string, number> = {};
  let step = 0;
  let solved = 0;
  let answered = false;

  function renderProfile(): void {
    $("lf-avatar").textContent = profile.who;
    $("lf-who").textContent = `Student ${profile.who}`;
    $("lf-wrote").innerHTML = m(profile.wrote);
    $("lf-made-for").textContent = `Picked for Student ${profile.who} · practising ${profile.gapSkill.toLowerCase()}`;
    host.querySelectorAll<HTMLButtonElement>("[data-lf-student]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lfStudent === code)));
    $("lf-skills").innerHTML = profile.skills.map((s) => {
      const level = levels[s.name]!;
      const gap = s.name === profile.gapSkill;
      const tag = gap ? level >= 90 ? '<em class="is-fixed">Fixed ✓</em>' : "<em>Gap</em>" : "";
      return `<li class="${gap ? level >= 90 ? "is-fixed" : "is-gap" : ""}"><span>${m(s.name)} ${tag}</span><i><b style="width:${level}%"></b></i></li>`;
    }).join("");
  }

  function renderQuestion(): void {
    const q = profile.steps[step]!;
    answered = false;
    $("lf-levels").innerHTML = profile.steps.map((_, i) => `<i class="${i <= step ? "is-on" : ""}"></i>`).join("") + `<span>Level ${step + 1}</span>`;
    $("lf-prompt").firstElementChild!.textContent = profile.prompt(q);
    $("lf-diagram").innerHTML = tiles(q, profile.style);
    const options = (q.cols + q.rows) % 2 ? [q.right, q.wrong] : [q.wrong, q.right];
    $("lf-answers").innerHTML = options.map((n) => `<button type="button" data-lf-answer="${n}">${n} ${profile.unit}</button>`).join("");
    $("lf-answer-feedback").textContent = "";
    $("lf-next").hidden = true;
  }

  function load(next: string): void {
    if (!PROFILES[next]) return;
    code = next;
    profile = PROFILES[code]!;
    levels = Object.fromEntries(profile.skills.map((s) => [s.name, s.level]));
    step = 0;
    solved = 0;
    renderProfile();
    renderQuestion();
  }

  function answer(value: number): void {
    if (answered) return;
    answered = true;
    const q = profile.steps[step]!;
    const correct = value === q.right;
    host.querySelectorAll<HTMLButtonElement>("[data-lf-answer]").forEach((b) => {
      b.disabled = true;
      if (Number(b.dataset.lfAnswer) === value) b.classList.add(correct ? "is-correct" : "is-wrong");
    });
    const gap = profile.gapSkill;
    levels[gap] = Math.max(15, Math.min(95, levels[gap]! + (correct ? 22 : -8)));
    if (correct) solved += 1;
    renderProfile();
    const next = $("lf-next");
    next.hidden = false;
    if (correct) {
      $("lf-diagram").querySelector("svg")?.classList.add("is-solved");
      $("lf-answer-feedback").textContent = `✓ Right: ${profile.ok(q)}.`;
      if (step === profile.steps.length - 1 || levels[gap]! >= 90) {
        next.dataset.go = "done";
        next.textContent = "See the result →";
      } else {
        next.dataset.go = "up";
        next.textContent = "Harder one →";
      }
    } else {
      $("lf-answer-feedback").textContent = `✗ ${q.hint}`;
      next.dataset.go = "down";
      next.textContent = step > 0 ? "Easier one →" : "Try again →";
    }
  }

  function advance(go: string): void {
    if (go === "done") {
      levels[profile.gapSkill] = 95;
      renderProfile();
      $("lf-diagram").innerHTML = `<p class="lf-done"><b>✓</b>Gap closed in ${solved} questions.<br>Student ${profile.who} goes back to the Area topic.</p>`;
      $("lf-answers").innerHTML = "";
      $("lf-answer-feedback").textContent = "";
      $("lf-levels").innerHTML = "";
      const next = $("lf-next");
      next.dataset.go = "restart";
      next.textContent = "Start again";
      return;
    }
    if (go === "restart") { load(code); return; }
    if (go === "up") step = Math.min(profile.steps.length - 1, step + 1);
    if (go === "down") step = Math.max(0, step - 1);
    renderQuestion();
  }

  host.addEventListener("click", (event) => {
    const target = event.target as Element;
    const pick = target.closest<HTMLButtonElement>("[data-lf-answer]");
    if (pick) { answer(Number(pick.dataset.lfAnswer)); return; }
    const student = target.closest<HTMLButtonElement>("[data-lf-student]");
    if (student) { load(student.dataset.lfStudent!); return; }
    const next = target.closest<HTMLButtonElement>("#lf-next");
    if (next) advance(next.dataset.go ?? "up");
  });
  window.addEventListener("knowledge:error", (event) => {
    const next = (event as CustomEvent<{ code?: string }>).detail?.code;
    if (next && next !== code) load(next);
  });
  load(code);
}

function initBuildStory(host: HTMLElement): void {
  host.innerHTML = `<div class="lf-build-story">
    <article><span>01</span><h3>I mapped how the maths skills connect.</h3></article>
    <article><span>02</span><h3>I built the reading of handwritten working.</h3></article>
    <article><span>03</span><h3>I built the teacher's live view.</h3></article>
  </div>
  <div class="lf-funnel" aria-label="Schools">
    <div style="--w:100%"><b>200+</b><span>schools I pitched to</span></div>
    <div style="--w:75%"><b>150</b><span>tried it with us</span></div>
    <div style="--w:40%"><b>30+</b><span>now pay for it</span></div>
  </div>`;
}

export function initLearningFlow(): void {
  const teacher = document.getElementById("teacher-experience");
  const challenge = document.getElementById("next-challenge");
  const buildStory = document.getElementById("build-story");
  if (teacher) initTeacher(teacher);
  if (challenge) initChallenge(challenge);
  if (buildStory) initBuildStory(buildStory);
}



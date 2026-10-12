import "./learning-flow.css";
import { QUESTIONS, m } from "../data/area";
import type { BankError } from "../data/area";
import { subscribeGarden } from "../game/state";
import type { GardenState } from "../game/state";

const question = QUESTIONS[0];
const perimeterError = question.errors[0];
const additionError = question.errors[1];
const help: Record<number, BankError> = {
  2: perimeterError, 9: perimeterError, 17: perimeterError, 22: perimeterError,
  5: additionError, 13: additionError, 27: additionError,
};
const liveOrder = [14, 3, 22, 8, 27, 0, 18, 11, 25, 5, 16, 1, 29, 9, 20, 6, 13, 24, 2, 17, 28, 10, 21, 4, 15, 26, 7, 19, 12, 23];

function initTeacher(host: HTMLElement): (state: GardenState) => void {
  type Mode = "manual" | "live";
  interface Lane { mode: Mode; dots: HTMLButtonElement[]; clock: HTMLElement; note: HTMLElement; order: number[]; revealed: number; duration: number; }
  host.innerHTML = `
    <div class="lf-comparison">
      <header class="lf-comparison__head"><p>Same 30 pupils. Same working.<br><b>A different moment to help.</b></p><button class="lf-replay" id="lf-sim-replay" type="button">↻ Replay</button></header>
      <div class="lf-lanes">${(["manual", "live"] as Mode[]).map((mode) => `
        <article class="lf-lane lf-lane--${mode}">
          <div class="lf-lane__head"><div><span>${mode === "manual" ? "Reading each notebook" : "Seeing the class together"}</span><h3>${mode === "manual" ? "Manual marking" : "MathsAI live feedback"}</h3></div><b class="lf-clock" id="lf-${mode}-clock">${mode === "manual" ? "0h 00m" : "0:00"}</b></div>
          <div class="lf-pupils" id="lf-${mode}-pupils" role="group" aria-label="${mode === "manual" ? "Manual marking" : "MathsAI feedback"}: 30 illustrative pupils">${Array.from({ length: 30 }, (_, index) => `<button type="button" data-lf-pupil="${index}" class="lf-pupil" aria-label="Example pupil ${index + 1}: work not checked" disabled>${String(index + 1).padStart(2, "0")}</button>`).join("")}</div>
          <p class="lf-lane__note" id="lf-${mode}-note">${mode === "manual" ? "One notebook at a time…" : "Errors appear while the lesson is running."}</p>
        </article>`).join("")}</div>
      <div class="lf-legend"><span><i class="lf-legend__unchecked"></i>Not checked</span><span><i class="lf-legend__matches"></i>Working matches</span><span><i class="lf-legend__help"></i>Needs help · select a pupil</span></div>
      <div class="lf-feedback" id="lf-feedback-details" aria-live="polite"><p class="lf-feedback__hint">Select a pupil as their working is checked.</p></div>
      <p class="lf-comparison__caption">Illustrative comparison using 30 example attempts. Reported teacher feedback time: next day → five minutes.</p>
      <p class="lf-your-attempt" id="lf-reader-attempt" hidden></p>
    </div>`;

  const root = host.querySelector<HTMLElement>(".lf-comparison")!;
  const detail = host.querySelector<HTMLElement>("#lf-feedback-details")!;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const lanes: Lane[] = (["manual", "live"] as Mode[]).map((mode) => ({
    mode,
    dots: Array.from(host.querySelectorAll<HTMLButtonElement>(`#lf-${mode}-pupils button`)),
    clock: host.querySelector<HTMLElement>(`#lf-${mode}-clock`)!,
    note: host.querySelector<HTMLElement>(`#lf-${mode}-note`)!,
    order: mode === "manual" ? Array.from({ length: 30 }, (_, index) => index) : liveOrder,
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
    const action = !error ? "Let this pupil move on while you help the pupils who need it." : error === perimeterError ? "Help separate the edge from the space inside." : "Build equal rows, then connect the count to multiplication.";
    detail.innerHTML = `<div><span class="lf-small">Example pupil ${index + 1} · 8 cm × 6 cm</span><div class="lf-handwriting">${(error?.wrote ?? question.correct).map((line) => `<span>${m(line)}</span>`).join("")}</div></div><div class="lf-feedback__action"><span class="lf-small">Teacher’s next move</span><h3>${error ? "This pupil needs help." : "The working matches."}</h3><p>${action}</p>${error ? `<a href="#reward">See the follow-up ↓</a>` : ""}</div>`;
    lanes.forEach((lane) => lane.dots.forEach((dot, pupil) => { dot.classList.toggle("is-selected", pupil === index && !dot.disabled); dot.setAttribute("aria-pressed", String(pupil === index && !dot.disabled)); }));
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
        dot.setAttribute("aria-label", `Example pupil ${pupil + 1}: ${help[pupil] ? "needs help; select to see their working" : "working matches"}`);
      }
      if (lane.mode === "manual") {
        const minutes = Math.round(progress * 24 * 60);
        lane.clock.textContent = progress === 1 ? "Next day" : `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}m`;
      } else {
        const seconds = Math.round(progress * 5 * 60);
        lane.clock.textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
      }
      const flagged = lane.order.slice(0, lane.revealed).filter((pupil) => help[pupil]).length;
      lane.note.textContent = progress === 1 ? lane.mode === "manual" ? "7 pupils needed help. The teacher finds out the next day." : "7 pupils need help. The teacher can respond during the lesson." : `${lane.revealed} / 30 checked${flagged ? ` · ${flagged} need help` : ""}`;
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
      lane.dots.forEach((dot, index) => {
        dot.className = "lf-pupil";
        dot.disabled = true;
        dot.setAttribute("aria-pressed", "false");
        dot.setAttribute("aria-label", `Example pupil ${index + 1}: work not checked`);
      });
    });
    detail.innerHTML = `<p class="lf-feedback__hint">Select a pupil as their working is checked.</p>`;
    render();
    start();
  }
  lanes.forEach((lane) => lane.dots.forEach((dot, index) => dot.addEventListener("click", () => pick(index))));
  host.querySelector<HTMLButtonElement>("#lf-sim-replay")!.addEventListener("click", replay);
  const observer = new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    if (visible) start(); else stop();
  }, { threshold: .12 });
  observer.observe(root);
  document.addEventListener("visibilitychange", () => { if (document.hidden) stop(); else start(); });
  reduced.addEventListener("change", replay);
  render();

  return (state: GardenState): void => {
    const plan = state.activePlan ?? state.plans.at(-1);
    const line = host.querySelector<HTMLElement>("#lf-reader-attempt")!;
    line.hidden = !plan;
    if (plan) line.innerHTML = `<b>Your garden:</b> ${plan.length} m × ${plan.width} m covers ${plan.area} m². ${!plan.validFence ? `Revisit the fence constraint: ${plan.fence} m used.` : plan.correctPrediction ? "Your prediction matches." : `Your prediction of ${plan.prediction} plants needs a check.`}`;
  };
}

function initChallenge(host: HTMLElement): void {
  host.innerHTML = `
    <div class="lf-follow-up">
      <div class="lf-follow-up__explanation"><span class="lf-small">Practice chosen from the mistake</span><h3 id="lf-practice-heading">From counting the fence<br>to covering the space.</h3><p class="lf-follow-up__wrong" id="lf-example-working">${m(perimeterError.wrote.join(" "))}</p><p id="lf-practice-reason">The next set is chosen from what the student got wrong. Here, they practise covering space with square tiles.</p></div>
      <div class="lf-quick-question">
        <p>Each tile is 1 m².<br><b>How much space does this garden cover?</b></p>
        <svg class="lf-question-diagram" viewBox="0 0 180 140" role="img" aria-label="A four-metre by three-metre rectangle covered by twelve square-metre tiles"><rect x="42" y="24" width="96" height="72" rx="4"/><path d="M66 24v72M90 24v72M114 24v72M42 48h96M42 72h96"/><text x="90" y="119">4 m</text><text x="21" y="64">3 m</text></svg>
        <div class="lf-quick-answers" role="group" aria-label="Choose the area"><button type="button" data-lf-answer="12" aria-pressed="false">12 m²</button><button type="button" data-lf-answer="14" aria-pressed="false">14 m²</button></div>
        <p class="lf-answer-feedback" id="lf-answer-feedback" aria-live="polite">Count the tiles inside the fence.</p>
      </div>
    </div>`;
  const answers = Array.from(host.querySelectorAll<HTMLButtonElement>("[data-lf-answer]"));
  answers.forEach((answer) => answer.addEventListener("click", () => {
    const correct = answer.dataset.lfAnswer === "12";
    answers.forEach((option) => { option.setAttribute("aria-pressed", String(option === answer)); });
    host.querySelector<HTMLElement>("#lf-answer-feedback")!.textContent = correct ? "That matches: 4 × 3 = 12 m². Area is the space inside; the fence around it is 14 m long." : "14 comes from counting the fence: 2 × (4 + 3). Count the squares inside for area.";
  }));
  window.addEventListener("knowledge:error", (event) => {
    const detail = (event as CustomEvent<{ questionId?: string; code?: string }>).detail;
    const selected = QUESTIONS.find((candidate) => candidate.id === detail?.questionId);
    const error = selected?.errors.find((candidate) => candidate.code === detail?.code);
    if (!error) return;
    host.querySelector<HTMLElement>("#lf-example-working")!.innerHTML = m(error.wrote.join(" "));
    host.querySelector<HTMLElement>("#lf-practice-heading")!.innerHTML = error.code === "AREA_UNIT_ERROR" ? "From length units<br>to square units." : error.code === "AREA_FORMULA_ERROR" ? "From adding the sides<br>to building equal rows." : "From counting the fence<br>to covering the space.";
    host.querySelector<HTMLElement>("#lf-practice-reason")!.textContent = error.code === "AREA_UNIT_ERROR" ? "The number is right, but area needs square units. The next practice makes one square metre visible." : error.code === "AREA_FORMULA_ERROR" ? "The next set is chosen from what the student got wrong. Here, equal rows show why area uses multiplication." : "The next set is chosen from what the student got wrong. Here, they practise covering space with square tiles.";
  });
}

function initBuildStory(host: HTMLElement): void {
  host.innerHTML = `<div class="lf-build-story">
    <article><span>01</span><div><h3>I mapped how the skills connect.</h3><p>I structured the EDB maths curriculum into concepts, prerequisites and errors, so feedback can trace what needs revisiting.</p></div></article>
    <article><span>02</span><div><h3>I built analysis of handwritten working.</h3><p>The engine reads the steps a student wrote, so feedback can address the reasoning behind an answer.</p></div></article>
    <article><span>03</span><div><h3>I built the teacher’s feedback view.</h3><p>A principal wanted to see students’ working. I turned that request into progress and error analysis teachers could use during a lesson.</p></div></article>
  </div>`;
}

export function initLearningFlow(): void {
  const teacher = document.getElementById("teacher-experience");
  const challenge = document.getElementById("next-challenge");
  const buildStory = document.getElementById("build-story");
  if (teacher) subscribeGarden(initTeacher(teacher));
  if (challenge) initChallenge(challenge);
  if (buildStory) initBuildStory(buildStory);
}

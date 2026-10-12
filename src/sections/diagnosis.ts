import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { reduced } from "../motion";
import { PREREQS, QUESTIONS, TOPIC, m, type BankError, type BankQuestion } from "../data/area";

gsap.registerPlugin(ScrollTrigger);

const SVG_NS = "http://www.w3.org/2000/svg";

const PLAIN: Record<string, string> = {
  PERIMETER_AREA_CONFUSION: "Perimeter instead of area",
  AREA_FORMULA_ERROR: "Added instead of multiplied",
  AREA_UNIT_ERROR: "Length unit for an area",
};

function $(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing #${id}`);
  return el;
}

function drawShape(svg: HTMLElement, q: BankQuestion): void {
  svg.replaceChildren();
  const maxW = 150;
  const maxH = 84;
  const k = Math.min(maxW / q.shape.w, maxH / q.shape.h);
  const w = q.shape.w * k;
  const h = q.shape.h * k;
  const x = (220 - w) / 2;
  const y = (120 - h) / 2 - 2;

  const rect = document.createElementNS(SVG_NS, "rect");
  rect.setAttribute("class", "shape-rect");
  rect.setAttribute("x", String(x));
  rect.setAttribute("y", String(y));
  rect.setAttribute("width", String(w));
  rect.setAttribute("height", String(h));
  rect.setAttribute("pathLength", "1");
  svg.appendChild(rect);

  const label = (text: string, lx: number, ly: number, anchor: string): void => {
    const t = document.createElementNS(SVG_NS, "text");
    t.setAttribute("class", "shape-label");
    t.setAttribute("x", String(lx));
    t.setAttribute("y", String(ly));
    t.setAttribute("text-anchor", anchor);
    t.textContent = text;
    svg.appendChild(t);
  };
  label(q.shape.labelW, x + w / 2, y + h + 15, "middle");
  label(q.shape.labelH, x + w + 8, y + h / 2 + 4, "start");
}

function treeHtml(err: BankError): { topic: string; err: string; link: string } {
  const topic = `<small>Topic</small><b>${TOPIC.code} ${TOPIC.name}</b><span>${TOPIC.grade} · ${TOPIC.strand}</span><em>Built on ${PREREQS.map((p) => p.code).join(" and ")}</em>`;
  const e = `<small>Error</small><b class="code">${err.code}</b><span>${err.severity} · ${err.category}</span>`;
  const link = err.linked
    ? `<small>${err.linkedHow}</small><b>${err.linked.code} ${err.linked.name}</b><span>${err.linked.grade} · ${err.linked.strand}</span><em>${err.linked.note ?? ""}</em>`
    : `<small>${err.linkedHow}</small><b>Stays inside ${TOPIC.code}</b><span>The idea to rebuild</span><em>cm counts length. cm<sup>2</sup> counts squares.</em>`;
  return { topic, err: e, link };
}

export function initDiagnosis(): void {
  const root = document.querySelector<HTMLElement>('[data-scene="error"]');
  if (!root) return;

  const qTabs = $("err-q");
  const eTabs = $("err-e");
  const prompt = $("err-prompt");
  const shape = $("err-shape");
  const lines = $("err-lines");
  const should = $("err-should");
  const sym = $("err-sym");
  const tags = $("err-tags");
  const desc = $("err-desc");
  const mis = $("err-mis");
  const tTopic = $("tn-topic");
  const tErr = $("tn-err");
  const tLink = $("tn-link");

  let qi = 0;
  let ei = 0;
  let tl: gsap.core.Timeline | null = null;

  const q = (): BankQuestion => QUESTIONS[qi];
  const err = (): BankError => QUESTIONS[qi].errors[ei];

  function buildTabs(): void {
    qTabs.replaceChildren();
    QUESTIONS.forEach((item, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("role", "tab");
      b.setAttribute("aria-selected", String(i === qi));
      b.textContent = item.label;
      b.addEventListener("click", () => {
        qi = i;
        ei = 0;
        buildTabs();
        render(true);
      });
      qTabs.appendChild(b);
    });
    eTabs.replaceChildren();
    q().errors.forEach((item, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("role", "tab");
      b.setAttribute("aria-selected", String(i === ei));
      b.textContent = `Mistake ${i + 1}: ${PLAIN[item.code] ?? item.code}`;
      b.addEventListener("click", () => {
        ei = i;
        buildTabs();
        render(true);
      });
      eTabs.appendChild(b);
    });
  }

  function fill(): void {
    const item = q();
    const e = err();
    prompt.textContent = item.prompt;
    drawShape(shape, item);

    lines.replaceChildren();
    e.wrote.forEach((text) => {
      const row = document.createElement("div");
      row.className = "hl";
      row.innerHTML = `<span class="hw__ink">${m(text)}</span>`;
      lines.appendChild(row);
    });
    const mark = document.createElement("span");
    mark.className = "xmark";
    mark.textContent = "✗";
    mark.setAttribute("aria-label", "marked as an error");
    lines.lastElementChild?.appendChild(mark);

    should.innerHTML = m(e.should);
    sym.innerHTML = `<span class="sym__a">${m(e.wrote.join("  "))}</span><span class="sym__vs">is</span><span class="sym__b">${m(e.inSymbols)}</span>`;
    tags.innerHTML = `<span class="tag tag--code">${e.code}</span><span class="tag tag--${e.severity}">${e.severity}</span><span class="tag">${e.category}</span>`;
    desc.innerHTML = m(e.description);
    mis.textContent = e.misconception;
    const t = treeHtml(e);
    tTopic.innerHTML = t.topic;
    tErr.innerHTML = t.err;
    tLink.innerHTML = t.link;
  }

  function animate(): void {
    tl?.kill();
    const sel = gsap.utils.selector(root);
    tl = gsap.timeline();
    tl.fromTo(sel(".shape-rect"), { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.8, ease: "power1.inOut" }, 0);
    tl.fromTo(sel(".shape-label"), { opacity: 0 }, { opacity: 1, duration: 0.4, stagger: 0.15 }, 0.7);

    let t = 1.2;
    sel(".hl").forEach((row) => {
      const ink = row.querySelector(".hw__ink");
      const len = (ink?.textContent ?? "").length;
      const dur = Math.max(0.6, len * 0.06);
      tl!.fromTo(ink, { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: dur, ease: "none" }, t);
      t += dur + 0.2;
    });
    tl.fromTo(sel(".xmark"), { scale: 0, rotate: -30 }, { scale: 1, rotate: 0, duration: 0.45, ease: "back.out(3)" }, t);
    tl.fromTo(sel(".sheet"), { boxShadow: "0 0 0 0 rgba(228,87,46,0)" }, { boxShadow: "0 0 0 5px rgba(228,87,46,0.35)", duration: 0.4 }, t);
    tl.fromTo(sel(".should"), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5 }, t + 0.4);

    const r = t + 0.7;
    tl.fromTo(sel(".sym__a"), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5 }, r);
    tl.fromTo(sel(".sym__vs"), { opacity: 0 }, { opacity: 1, duration: 0.3 }, r + 0.35);
    tl.fromTo(sel(".sym__b"), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5 }, r + 0.55);
    tl.fromTo(sel(".tag"), { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.35, ease: "back.out(2.4)", stagger: 0.12 }, r + 0.9);
    tl.fromTo(sel(".read__txt dt, .read__txt dd"), { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.45, stagger: 0.18 }, r + 1.2);

    const s = r + 2.2;
    tl.fromTo(sel(".tree__node--topic"), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5 }, s);
    tl.fromTo(sel(".tree__arrow").slice(0, 1), { scaleX: 0 }, { scaleX: 1, duration: 0.4 }, s + 0.4);
    tl.fromTo(sel(".tree__node--err"), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5 }, s + 0.7);
    tl.fromTo(sel(".tree__arrow").slice(1), { scaleX: 0 }, { scaleX: 1, duration: 0.4 }, s + 1.1);
    tl.fromTo(sel(".tree__node--link"), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5 }, s + 1.4);
    tl.fromTo(sel(".tree__node--link"), { boxShadow: "0 0 0 0 rgba(228,87,46,0)" }, { boxShadow: "0 0 0 6px rgba(228,87,46,0.28)", duration: 0.5, yoyo: true, repeat: 1 }, s + 1.9);

    if (reduced()) tl.progress(1, false).pause();
  }

  const hide = gsap.utils.selector(root);
  const show = (): void => {
    gsap.set(hide(".diag__grid, .tree"), { opacity: 1 });
  };

  function render(play: boolean): void {
    fill();
    show();
    if (play) animate();
    else tl?.kill();
  }

  buildTabs();
  fill();
  // Hidden until the scene scrolls in, so the first play is a reveal.
  gsap.set(hide(".diag__grid, .tree"), { opacity: 0 });

  const start = (): void => {
    show();
    animate();
  };
  ScrollTrigger.create({ trigger: root, start: "top 70%", once: true, onEnter: start });
  root.querySelectorAll<HTMLElement>("[data-replay]").forEach((b) => b.addEventListener("click", () => render(true)));
}

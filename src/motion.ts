import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

/** True when the visitor asked the OS for less motion. Everything animated must also work without motion. */
export const reduced = (): boolean => reducedQuery.matches;

export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => window.setTimeout(resolve, reduced() ? 0 : ms));

function formatCount(value: number, prefix: string, suffix: string): string {
  return `${prefix}${Math.round(value).toLocaleString("en-US")}${suffix}`;
}

function setupScrollState(): void {
  const bar = document.getElementById("progress-bar");
  ScrollTrigger.create({
    start: 0,
    end: "max",
    onUpdate: (self) => {
      if (bar) bar.style.transform = `scaleX(${self.progress})`;
    },
  });

  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>(".dots a"));
  const setActive = (id: string): void => {
    links.forEach((a) => a.classList.toggle("on", a.getAttribute("href") === `#${id}`));
    document.body.classList.toggle("on-dark", id === "game");
  };
  for (const link of links) {
    const id = link.getAttribute("href")?.slice(1);
    const section = id ? document.getElementById(id) : null;
    if (!id || !section) continue;
    ScrollTrigger.create({
      trigger: section,
      start: "top 50%",
      end: "bottom 50%",
      onToggle: (self) => {
        if (self.isActive) setActive(id);
      },
    });
  }
  setActive("top");
}

function setupSpotlight(): void {
  const grid = document.querySelector<HTMLElement>(".hero__grid");
  const hero = document.querySelector<HTMLElement>(".hero");
  if (!grid || !hero) return;
  hero.addEventListener("pointermove", (e) => {
    const r = grid.getBoundingClientRect();
    grid.style.setProperty("--mx", `${e.clientX - r.left}px`);
    grid.style.setProperty("--my", `${e.clientY - r.top}px`);
  });
}

export function initMotion(): void {
  setupScrollState();
  setupSpotlight();

  const mm = gsap.matchMedia();

  mm.add("(prefers-reduced-motion: no-preference)", () => {
    // One scroll authority: Lenis drives GSAP's ticker, ScrollTrigger follows Lenis.
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number): void => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    const onAnchor = (e: MouseEvent): void => {
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
      if (!a) return;
      const target = document.querySelector<HTMLElement>(a.getAttribute("href") ?? "");
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: 0, duration: 1.2 });
    };
    document.addEventListener("click", onAnchor);

    // Hero intro
    gsap.from("[data-split]", { yPercent: 110, duration: 1.1, ease: "power4.out", stagger: 0.12 });
    gsap.from("[data-hero]", { y: 22, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.1, delay: 0.5 });
    gsap.to(".hero__grid", {
      yPercent: 12,
      ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
    });

    // Reveal on scroll
    gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
      gsap.from(el, {
        y: 36,
        opacity: 0,
        duration: 0.9,
        ease: "power3.out",
        clearProps: "opacity,transform",
        scrollTrigger: { trigger: el, start: "top 88%", once: true },
      });
    });

    // Count-up numbers
    gsap.utils.toArray<HTMLElement>("[data-count]").forEach((el) => {
      const target = Number(el.dataset.count);
      const prefix = el.dataset.prefix ?? "";
      const suffix = el.dataset.suffix ?? "";
      const state = { v: 0 };
      el.textContent = formatCount(0, prefix, suffix);
      gsap.to(state, {
        v: target,
        duration: 1.8,
        ease: "power2.out",
        onUpdate: () => {
          el.textContent = formatCount(state.v, prefix, suffix);
        },
        scrollTrigger: { trigger: el, start: "top 95%", once: true },
      });
    });

    return () => {
      document.removeEventListener("click", onAnchor);
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  });
}

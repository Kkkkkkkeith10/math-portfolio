import "./town.css";
import type { SceneName } from "./town-scenes";

const PLACES: { scene: SceneName; skill: string; title: string; task: string }[] = [
  { scene: "dam", skill: "Measuring", title: "Fix the dam", task: "Measure the gap and cut a plank that fits." },
  { scene: "market", skill: "Money", title: "Run the market", task: "Add up the fruit and give the right change." },
  { scene: "bakery", skill: "Fractions", title: "Share the cake", task: "Cut it so every friend gets an equal piece." },
];

const COIN = `<svg viewBox="0 0 64 64" aria-hidden="true"><polygon points="32,4 52,12 60,32 52,52 32,60 12,52 4,32 12,12" fill="#f2c14e"/><polygon points="32,4 52,12 32,32" fill="#ffd979"/><polygon points="52,12 60,32 32,32" fill="#f6cd5f"/><polygon points="60,32 52,52 32,32" fill="#e0a92e"/><polygon points="52,52 32,60 32,32" fill="#c99419"/><polygon points="32,60 12,52 32,32" fill="#d9a52c"/><polygon points="12,52 4,32 32,32" fill="#e8b641"/><polygon points="4,32 12,12 32,32" fill="#ffe28a"/><polygon points="12,12 32,4 32,32" fill="#ffeaa8"/><polygon points="32,16 44,22 48,32 44,42 32,48 20,42 16,32 20,22" fill="none" stroke="#a87413" stroke-width="2.5"/><path d="M32 23v18M27 27h8a3 3 0 0 1 0 5h-6a3 3 0 0 0 0 5h8" fill="none" stroke="#a87413" stroke-width="3" stroke-linecap="round"/></svg>`;
const TROPHY = `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M18 14H8c0 12 6 18 14 18M46 14h10c0 12-6 18-14 18" fill="none" stroke="#e0a92e" stroke-width="4" stroke-linejoin="round"/><polygon points="18,8 46,8 44,28 32,38 20,28" fill="#f2c14e"/><polygon points="18,8 32,8 32,38 20,28" fill="#ffd979"/><polygon points="32,8 46,8 44,28 32,38" fill="#d9a52c"/><polygon points="28,38 36,38 38,46 26,46" fill="#c99419"/><polygon points="20,46 44,46 46,56 18,56" fill="#5b9f93"/><polygon points="20,46 32,46 32,56 18,56" fill="#76b6a9"/><polygon points="28,18 32,13 36,18 32,24" fill="#fff4cc"/></svg>`;
const HOUSE = `<svg viewBox="0 0 64 64" aria-hidden="true"><polygon points="32,6 58,28 6,28" fill="#c97556"/><polygon points="32,6 58,28 32,28" fill="#b0613f"/><polygon points="10,28 54,28 54,58 10,58" fill="#f4e8cf"/><polygon points="32,28 54,28 54,58 32,58" fill="#e4d3b2"/><polygon points="26,40 38,40 38,58 26,58" fill="#5b9f93"/><polygon points="32,40 38,40 38,58 32,58" fill="#356965"/><polygon points="14,34 22,34 22,42 14,42" fill="#bfe0e8"/><polygon points="42,34 50,34 50,42 42,42" fill="#a9d2dc"/><polygon points="44,10 50,10 50,20 44,16" fill="#8b6342"/></svg>`;

export function initTown(): void {
  const host = document.getElementById("town");
  if (!host) return;
  host.innerHTML = `<div class="town">
    <div class="town-places">${PLACES.map((p) => `
      <article class="town-card">
        <div class="town-scene" data-scene="${p.scene}" data-title="${p.title}" role="group" aria-label="${p.title}, a low-poly 3D scene you can drag to turn"><span class="town-drag" aria-hidden="true">↔ Drag to turn</span></div>
        <div class="town-card__body"><div class="town-card__top"><h3>${p.title}</h3><span class="town-skill">${p.skill}</span></div><p>${p.task}</p></div>
      </article>`).join("")}
    </div>
    <div class="town-pager" aria-hidden="true"><span class="town-dots">${PLACES.map((_p, i) => `<i${i === 0 ? ' class="is-on"' : ""}></i>`).join("")}</span><span class="town-swipe">Swipe for more →</span></div>
    <div class="town-reward">
      <ul class="town-loop">
        <li>${COIN}<b>Collect coins</b></li>
        <li>${TROPHY}<b>Get trophies</b></li>
        <li>${HOUSE}<b>Decorate home</b></li>
      </ul>
      <p>Every problem solved earns coins. The more they practise, the more their home grows, so students keep coming back.</p>
    </div>
  </div>`;

  const places = host.querySelector<HTMLElement>(".town-places")!;
  const dots = Array.from(host.querySelectorAll<HTMLElement>(".town-dots i"));
  const swipe = host.querySelector<HTMLElement>(".town-swipe")!;
  places.addEventListener("scroll", () => {
    const cards = Array.from(places.children) as HTMLElement[];
    const left = places.getBoundingClientRect().left;
    let current = 0;
    cards.forEach((card, i) => { if (Math.abs(card.getBoundingClientRect().left - left) < Math.abs(cards[current]!.getBoundingClientRect().left - left)) current = i; });
    dots.forEach((dot, i) => dot.classList.toggle("is-on", i === current));
    swipe.classList.toggle("is-end", current === cards.length - 1);
  }, { passive: true });

  const io = new IntersectionObserver((entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    io.disconnect();
    void import("./town-scenes").then(({ mountDiorama }) => {
      host.querySelectorAll<HTMLElement>("[data-scene]").forEach((el) => mountDiorama(el, el.dataset.scene as SceneName));
    });
  }, { rootMargin: "400px" });
  io.observe(host);
}

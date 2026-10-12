interface Stage {
  title: string;
  points: string[];
}

const STAGES: Stage[] = [
  {
    title: "200+ schools pitched",
    points: [
      "Chose which schools to approach.",
      "Wrote the pitch and decided how to position the product.",
      "Invited schools to co-develop the system with us instead of simply buying it.",
    ],
  },
  {
    title: "150 early collaborations",
    points: [
      "Ran the school co-development campaign, so schools shaped what got built.",
      "Visited classrooms to watch lessons and talk with maths teachers and principals.",
      "Handed the collaborating schools to the sales team.",
    ],
  },
  {
    title: "30+ paying schools",
    points: [
      "Set the per-user subscription pricing and packaging.",
      "Designed the plan that moves a school from pilot to paying.",
      "Went back to schools to hear their requests and build features for them.",
    ],
  },
];

export function initFunnel(): void {
  const bars = Array.from(document.querySelectorAll<HTMLButtonElement>("#funnel-bars .bar"));
  const detail = document.getElementById("funnel-detail");
  if (!detail || bars.length === 0) return;

  function show(i: number): void {
    bars.forEach((b, k) => b.setAttribute("aria-selected", String(k === i)));
    const stage = STAGES[i];
    const h = document.createElement("h3");
    h.textContent = stage.title + ": what I did";
    const ul = document.createElement("ul");
    for (const p of stage.points) {
      const li = document.createElement("li");
      li.textContent = p;
      ul.appendChild(li);
    }
    detail!.replaceChildren(h, ul);
  }

  bars.forEach((b, i) => b.addEventListener("click", () => show(i)));
  show(0);
}

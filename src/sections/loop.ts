import { scene } from "../scene";

interface Step {
  title: string;
  icon: string;
  note: string;
}

const STEPS: Step[] = [
  { title: "Mission", icon: "◈", note: "A real-life scene and a character. The student decides what to build, then writes it in the notebook." },
  { title: "Notebook", icon: "✎", note: "The working is saved as a page, so the student can come back and revise it later." },
  { title: "Error, in maths", icon: "∑", note: "The working is matched to a catalogued error: what was written, what it should be, and why it happened." },
  { title: "Prerequisite map", icon: "⌖", note: "The error points back to the topic that needs rebuilding, for example Area (4M2) back to Perimeter (4M1)." },
  { title: "Teacher board", icon: "▦", note: "All thirty students at once, with the same mistake grouped, while the lesson is still running." },
  { title: "Challenge", icon: "◧", note: "A short task aimed at the gap: cover the 8 × 6 rectangle with squares and count them." },
  { title: "Reward", icon: "★", note: "Coins, a Find card and a trophy for what the student actually understood. Then the next mission." },
];

export function initLoop(): void {
  const chain = document.getElementById("loop-chain");
  const note = document.getElementById("loop-note");
  const root = document.querySelector<HTMLElement>('[data-scene="loop"]');
  if (!chain || !note || !root) return;

  const setNote = (i: number): void => {
    note.innerHTML = `<b>${i + 1}. ${STEPS[i].title}.</b> ${STEPS[i].note}`;
  };

  const nodes = STEPS.map((s, i) => {
    const li = document.createElement("li");
    li.dataset.on = "0";
    const b = document.createElement("button");
    b.type = "button";
    b.className = "lnode";
    b.innerHTML = `<span class="lnode__ic" aria-hidden="true">${s.icon}</span><span class="lnode__t">${s.title}</span>`;
    b.addEventListener("click", () => {
      setNote(i);
      nodes.forEach((n, j) => n.classList.toggle("sel", j === i));
    });
    li.appendChild(b);
    chain.appendChild(li);
    return li;
  });
  const back = document.createElement("li");
  back.className = "lback";
  back.innerHTML = `<span aria-hidden="true">↺</span> back to a new mission`;
  chain.appendChild(back);

  note.textContent = "Tap a step to see what it does.";

  scene(
    root,
    (tl) => {
      nodes.forEach((li, i) => {
        const at = 0.3 + i * 0.7;
        tl.set(li, { attr: { "data-on": "1" } }, at);
        tl.fromTo(li, { y: 16, opacity: 0.2 }, { y: 0, opacity: 1, duration: 0.45, ease: "back.out(2)" }, at);
        tl.call(() => setNote(i), [], at);
      });
      tl.fromTo(back, { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.5 }, 0.3 + nodes.length * 0.7);
    },
    () => {
      note.textContent = "Tap a step to see what it does.";
      nodes.forEach((n) => n.classList.remove("sel"));
    },
  );
}

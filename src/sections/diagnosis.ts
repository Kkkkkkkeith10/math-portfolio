import { reduced, sleep } from "../motion";

interface Example {
  label: string;
  steps: string[];
  badStep: number;
  /** Ordered from the skill the question tests, down to what it rests on. */
  chain: { title: string; note: string }[];
  gapIndex: number;
  result: string;
}

// Illustrative examples written for this page. Not the real curriculum map.
const EXAMPLES: Example[] = [
  {
    label: "Adding fractions",
    steps: ["1/2 + 1/3", "= (1 + 1) / (2 + 3)", "= 2/5"],
    badStep: 1,
    chain: [
      { title: "Adding fractions", note: "Where the mistake showed up" },
      { title: "Equivalent fractions", note: "Needs a common denominator first" },
      { title: "Fractions as parts of a whole", note: "Foundation" },
    ],
    gapIndex: 1,
    result:
      "The slip appears in adding fractions, but the gap is equivalent fractions. Practise renaming fractions to a common denominator, not more addition.",
  },
  {
    label: "Comparing decimals",
    steps: ["Which is bigger: 0.35 or 0.4?", "35 is bigger than 4", "So 0.35 is bigger"],
    badStep: 1,
    chain: [
      { title: "Comparing decimals", note: "Where the mistake showed up" },
      { title: "Place value after the point", note: "Digits read like whole numbers" },
      { title: "Place value in whole numbers", note: "Foundation" },
    ],
    gapIndex: 1,
    result:
      "The answer is wrong because the digits after the point are read like a whole number. The gap is decimal place value.",
  },
  {
    label: "Area of a rectangle",
    steps: ["Rectangle, 6 cm by 4 cm", "6 + 4 + 6 + 4 = 20", "Area = 20 cm²"],
    badStep: 1,
    chain: [
      { title: "Area of a rectangle", note: "Where the mistake showed up" },
      { title: "Area as covering with squares", note: "Perimeter and area are mixed up" },
      { title: "Multiplication as equal rows", note: "Foundation" },
    ],
    gapIndex: 1,
    result:
      "The student added the sides, which is the perimeter. The gap is seeing area as covering a shape with squares.",
  },
];

export function initDiagnosis(): void {
  const tabsEl = document.getElementById("diag-tabs");
  const stepsEl = document.getElementById("diag-steps");
  const chainEl = document.getElementById("diag-chain");
  const resultEl = document.getElementById("diag-result");
  const runBtn = document.getElementById("diag-run") as HTMLButtonElement | null;
  if (!tabsEl || !stepsEl || !chainEl || !resultEl || !runBtn) return;

  const RESULT_DEFAULT = "The result shows here: the real gap, and what to practise next.";
  let current = 0;
  let token = 0; // bumps to cancel a running animation

  const tabs = EXAMPLES.map((ex, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.setAttribute("role", "tab");
    b.textContent = ex.label;
    b.addEventListener("click", () => select(i));
    tabsEl.appendChild(b);
    return b;
  });

  function render(): void {
    const ex = EXAMPLES[current];
    stepsEl!.replaceChildren(
      ...ex.steps.map((s) => {
        const li = document.createElement("li");
        li.textContent = s;
        return li;
      }),
    );
    chainEl!.replaceChildren(
      ...ex.chain.map((c) => {
        const li = document.createElement("li");
        const b = document.createElement("b");
        b.textContent = c.title;
        const small = document.createElement("small");
        small.textContent = c.note;
        li.append(b, small);
        return li;
      }),
    );
    resultEl!.textContent = RESULT_DEFAULT;
  }

  function select(i: number): void {
    token++;
    current = i;
    tabs.forEach((t, k) => t.setAttribute("aria-selected", String(k === i)));
    runBtn!.disabled = false;
    render();
  }

  runBtn.addEventListener("click", async () => {
    const my = ++token;
    const ex = EXAMPLES[current];
    render();
    runBtn.disabled = true;
    const steps = Array.from(stepsEl.children);
    const chain = Array.from(chainEl.children);

    if (reduced()) {
      steps.forEach((s, i) => s.classList.add(i === ex.badStep ? "bad" : "read"));
      chain.forEach((c, i) => {
        c.classList.add("show");
        if (i === ex.gapIndex) {
          c.classList.add("gap");
          (c.querySelector("small") as HTMLElement).textContent = "The real gap";
        }
      });
      resultEl.textContent = ex.result;
      runBtn.disabled = false;
      return;
    }

    for (let i = 0; i < steps.length; i++) {
      steps[i].classList.add(i === ex.badStep ? "bad" : "read");
      await sleep(550);
      if (my !== token) return;
    }
    await sleep(350);
    for (let i = 0; i < chain.length; i++) {
      if (my !== token) return;
      chain[i].classList.add("show");
      if (i === ex.gapIndex) {
        chain[i].classList.add("gap");
        (chain[i].querySelector("small") as HTMLElement).textContent = "The real gap";
      }
      await sleep(650);
    }
    if (my !== token) return;
    resultEl.textContent = ex.result;
    runBtn.disabled = false;
  });

  select(0);
}

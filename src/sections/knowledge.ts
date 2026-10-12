import "./knowledge.css";
import { QUESTIONS, m } from "../data/area";
import { AREA_BANK_COUNTS, AREA_EDGES, AREA_TOPICS, type AreaEdge } from "../data/area-neighborhood";
import { subscribeGarden } from "../game/state";

interface SkillView {
  label: string;
  x: number;
  y: number;
  why: string;
  probe: { question: string; choices: string[]; correct: number; explanation: string };
}
const SKILLS: Record<string, SkillView> = {
  "4M2": { label: "Area", x: 350, y: 166, why: "Finding the space inside a rectangle depends on earlier number and shape skills.", probe: { question: "What does the area of a garden measure?", choices: ["Space covered inside", "Distance around its fence"], correct: 0, explanation: "Area counts the space inside. Perimeter counts the boundary." } },
  "3N4": { label: "Arithmetic operations", x: 225, y: 279, why: "An area question needs the right operation: multiply the rows and columns, rather than add the sides.", probe: { question: "Which calculation counts 6 rows of 4 squares?", choices: ["6 + 4", "6 × 4"], correct: 1, explanation: "Equal rows give 6 × 4 = 24 squares." } },
  "4S2": { label: "Forming shapes", x: 477, y: 279, why: "Splitting and rebuilding a shape helps a student see how its covered space can be counted.", probe: { question: "Rearrange the same 6 squares without gaps or overlaps. Does the covered space change?", choices: ["It stays the same", "It changes with the outline"], correct: 0, explanation: "The shape changes, but the same six squares cover the same amount of space." } },
  "3N2": { label: "Multiplication", x: 139, y: 392, why: "8 rows of 6 squares make 48 squares. Multiplication sits beneath the arithmetic branch.", probe: { question: "How many squares are in 8 equal rows of 6?", choices: ["14", "48", "28"], correct: 1, explanation: "8 × 6 = 48. Adding 8 and 6 does not count all the squares." } },
  "3N3": { label: "Division", x: 298, y: 392, why: "Division works backwards from covered space: 48 squares in 6 equal rows means 8 in each row.", probe: { question: "48 squares are divided into 6 equal rows. How many squares are in each row?", choices: ["6", "8", "42"], correct: 1, explanation: "48 ÷ 6 = 8 squares in each row." } },
  "4S1": { label: "Properties of quadrilaterals", x: 476, y: 392, why: "Recognising the properties of a rectangle helps a student choose and use its area formula.", probe: { question: "Which property is true of every rectangle?", choices: ["Four right angles", "Four equal side lengths"], correct: 0, explanation: "Every rectangle has four right angles. Its side lengths do not all have to be equal." } },
  "2N5": { label: "Addition and subtraction", x: 70, y: 529, why: "Earlier calculation supports multiplication: repeated equal additions help build the meaning of equal rows.", probe: { question: "What is 6 + 6 + 6 + 6?", choices: ["18", "24", "28"], correct: 1, explanation: "Four groups of six total 24." } },
  "2N6": { label: "Equal sharing", x: 218, y: 529, why: "Understanding equal groups supports the later multiplication and division used in area questions.", probe: { question: "Share 12 squares equally between 3 groups. How many are in each group?", choices: ["3", "4", "9"], correct: 1, explanation: "12 ÷ 3 = 4 squares in each equal group." } },
  "3S2": { label: "Triangles", x: 506, y: 529, why: "Recognising triangle pieces supports the later shape work that sits beneath area.", probe: { question: "How many straight sides does a triangle have?", choices: ["3", "4", "5"], correct: 0, explanation: "A triangle has three straight sides." } },
  "5M1": { label: "Later area learning", x: 350, y: 46, why: "The next area unit explicitly builds on Area (I). The same foundations support later learning.", probe: { question: "Which earlier area idea should be secure before moving on?", choices: ["Area measures covered space", "Area is the sum of side lengths"], correct: 0, explanation: "Covered space is the area idea to carry into later learning." } },
  "4N1": { label: "Larger multiplication", x: 579, y: 181, why: "This 8 × 6 bank question names Multiplication (II) as a question-specific prerequisite.", probe: { question: "What is 12 × 4?", choices: ["16", "48", "44"], correct: 1, explanation: "12 × 4 = 48. This checks a multiplication used in larger area calculations." } },
  "4M1": { label: "Perimeter", x: 116, y: 172, why: "The bank links this mistake to perimeter: adding the edges measures the fence, rather than the space inside.", probe: { question: "What is the perimeter of an 8 cm by 6 cm rectangle?", choices: ["14 cm", "28 cm", "48 cm"], correct: 1, explanation: "2 × (8 + 6) = 28 cm. Knowing this perimeter calculation is separate from choosing area correctly." } },
  "2S4": { label: "Four-sided shapes", x: 631, y: 423, why: "This bank question names early quadrilateral recognition as another question-specific prerequisite.", probe: { question: "Which shape is a quadrilateral?", choices: ["Triangle", "Rectangle", "Circle"], correct: 1, explanation: "A rectangle is a closed shape with four straight sides." } },
};

const ASSOCIATED = new Set(["4N1", "4M1", "2S4"]);
const TREE_LABELS: Record<string, string[]> = {
  "5M1": ["Later area"],
  "4M2": ["Area"],
  "3N4": ["Operations"],
  "4S2": ["Build", "shapes"],
  "3N2": ["Multiply"],
  "3N3": ["Divide"],
  "4S1": ["Shape", "properties"],
  "2N5": ["Add &", "subtract"],
  "2N6": ["Equal", "groups"],
  "3S2": ["Triangles"],
  "4N1": ["Larger", "products"],
  "4M1": ["Perimeter"],
  "2S4": ["4-sided", "shapes"],
};
const BANK_CASES = [
  { code: "AREA_FORMULA_ERROR", label: "Adds the sides", working: "8 + 6 = 14", note: "The wrong operation is used. Check the number skills beneath area.", focus: "3N2", action: "Explore the multiplication branch" },
  { code: "PERIMETER_AREA_CONFUSION", label: "Uses perimeter", working: "(8 + 6) × 2 = 28", note: "The fence is calculated correctly, but the question asks for covered space.", focus: "4M1", action: "Inspect the perimeter connection" },
];

function pathTo(code: string): string[] {
  if (code === "4M2") return [code];
  if (code === "5M1") return ["5M1", "4M2"];
  const queue: string[][] = [["4M2"]];
  const visited = new Set<string>();
  while (queue.length) {
    const path = queue.shift()!;
    const last = path[path.length - 1];
    if (last === code) return path;
    if (visited.has(last)) continue;
    visited.add(last);
    // Keep the curriculum route ahead of the separately recorded question links.
    AREA_EDGES.filter((edge) => edge.dependent === last).sort((a, b) => Number(a.kind !== "curriculum") - Number(b.kind !== "curriculum")).forEach((edge) => queue.push([...path, edge.foundation]));
  }
  return [code];
}

function edgePath(edge: AreaEdge): string {
  const from = SKILLS[edge.dependent];
  const to = SKILLS[edge.foundation];
  if (Math.abs(to.y - from.y) < 40) {
    const above = Math.min(from.y, to.y) - 58;
    return `M${from.x} ${from.y} C${from.x} ${above} ${to.x} ${above} ${to.x} ${to.y}`;
  }
  const middle = (from.y + to.y) / 2;
  return `M${from.x} ${from.y} C${from.x} ${middle} ${to.x} ${middle} ${to.x} ${to.y}`;
}

function treeHtml(selected: string, associations: boolean, checks: Map<string, boolean>): string {
  const path = pathTo(selected);
  const visible = AREA_TOPICS.filter((topic) => associations || !ASSOCIATED.has(topic.code));
  const visibleCodes = new Set(visible.map((topic) => topic.code));
  return `<svg class="kg-tree" viewBox="0 0 700 610" role="group" aria-label="Real Area curriculum neighborhood. Earlier skills are lower, later learning is higher."><defs><filter id="kg-node-glow" x="-300%" y="-300%" width="700%" height="700%"><feGaussianBlur stdDeviation="4" /></filter></defs>
    ${AREA_EDGES.filter((edge) => visibleCodes.has(edge.dependent) && visibleCodes.has(edge.foundation)).map((edge) => {
      const highlighted = path.some((code, i) => code === edge.dependent && path[i + 1] === edge.foundation);
      return `<path class="kg-branch kg-branch--${edge.kind}${highlighted ? " is-highlighted" : ""}" d="${edgePath(edge)}" aria-hidden="true" />`;
    }).join("")}
    ${visible.map((topic) => {
      const node = SKILLS[topic.code];
      const checked = checks.get(topic.code);
      return `<g class="kg-node${topic.code === selected ? " is-selected" : ""}${path.includes(topic.code) ? " is-on-path" : ""}${checked === true ? " is-checked" : checked === false ? " needs-check" : ""}" role="button" tabindex="0" aria-label="${m(node.label)}" aria-pressed="${topic.code === selected}" data-kg-node="${topic.code}"><circle class="kg-node__glow" cx="${node.x}" cy="${node.y}" r="9" filter="url(#kg-node-glow)"/><circle class="kg-node__hit" cx="${node.x}" cy="${node.y}" r="24"/><circle class="kg-node__ring" cx="${node.x}" cy="${node.y}" r="12"/><circle class="kg-node__core" cx="${node.x}" cy="${node.y}" r="5"/></g>`;
    }).join("")}
  </svg><span class="kg-branch-name kg-branch-name--numbers">Number skills</span><span class="kg-branch-name kg-branch-name--shapes">Shape skills</span>${visible.map((topic) => {
    const node = SKILLS[topic.code];
    return `<button type="button" class="kg-node-label${topic.code === selected ? " is-selected" : ""}${path.includes(topic.code) ? " is-on-path" : ""}" data-kg-select="${topic.code}" style="left:${node.x / 7}%;top:${node.y / 6.1}%" aria-label="${m(node.label)}" aria-pressed="${topic.code === selected}">${TREE_LABELS[topic.code].map((line) => `<span>${m(line)}</span>`).join("")}</button>`;
  }).join("")}`;
}

export function initKnowledge(): void {
  const root = document.getElementById("knowledge-explorer");
  if (!root) return;
  root.innerHTML = `<div class="kg"><div class="kg-bank-example"><div><span class="kg-small-label">Actual bank example · 8 cm × 6 cm rectangle</span><div class="kg-case-tabs" role="group" aria-label="Choose an area mistake">${BANK_CASES.map((item, i) => `<button type="button" data-kg-case="${i}" aria-pressed="${i === 0}">${item.label}</button>`).join("")}</div><p class="kg-student-working" id="kg-student-working"></p><p class="kg-correct-working">Area: 8 × 6 = 48 cm<sup>2</sup></p></div><div class="kg-error-note"><p id="kg-error-note"></p><button type="button" id="kg-explore-error"></button></div></div>
    <div class="kg-layout"><div class="kg-tree-card"><div class="kg-tree-heading"><span>Later learning</span><span>Click a point to explore</span></div><div class="kg-tree-frame" id="kg-tree-frame"></div><div class="kg-tree-bottom"><span>Earlier foundations</span><span><i></i> Curriculum prerequisite</span></div><label class="kg-show-links"><input type="checkbox" id="kg-show-links"> Show this question’s additional links</label><p class="kg-extra-legend" id="kg-extra-legend" hidden><i></i> Dashed links belong to this question or error.</p></div><div class="kg-skill-card" id="kg-skill-card"></div></div>
    <div class="kg-mobile-skills" id="kg-mobile-skills" role="group" aria-label="Explore the area skills"></div><p class="kg-garden-evidence" id="kg-garden-evidence" hidden></p>
    <details class="kg-source"><summary>From the real MathsAI curriculum data <span aria-hidden="true">+</span></summary><div><p>This focused view contains ${AREA_TOPICS.length} actual learning units around Area (I). Solid links come from the curriculum’s prerequisite records; dashed links are separate requirements or error associations for the 8 × 6 question.</p><p>The English Area bank contains <b>${AREA_BANK_COUNTS.questions} questions</b> and <b>${AREA_BANK_COUNTS.errorEntries} catalogued error entries</b> in this snapshot. Three questions and six error entries are published here.</p><a href="https://www.edb.gov.hk/attachment/en/curriculum-development/kla/ma/curr/pmc2017_e.pdf" target="_blank" rel="noopener noreferrer">Based on the Hong Kong EDB curriculum ↗</a><button type="button" data-kg-open-bank>See the published worked examples ↗</button><div class="kg-source-topics">${AREA_TOPICS.map((topic) => `<button type="button" data-kg-select="${topic.code}"><small>${topic.code} · P${topic.grade}</small>${m(topic.name)}</button>`).join("")}</div></div></details></div>`;

  let selected = "4M2";
  let associations = false;
  let caseIndex = 0;
  let probeOpen = false;
  const checks = new Map<string, boolean>();
  const answers = new Map<string, number>();
  const frame = root.querySelector<HTMLElement>("#kg-tree-frame")!;
  const card = root.querySelector<HTMLElement>("#kg-skill-card")!;
  const showLinks = root.querySelector<HTMLInputElement>("#kg-show-links")!;

  function syncBank(open: boolean): void {
    const code = BANK_CASES[caseIndex].code;
    const qi = QUESTIONS.findIndex((q) => q.id === "4M2_T2_Q2");
    if (qi < 0) return;
    const q = QUESTIONS[qi];
    document.querySelectorAll<HTMLButtonElement>("#err-q button")[qi]?.click();
    const ei = q.errors.findIndex((e) => e.code === code);
    if (ei >= 0) document.querySelectorAll<HTMLButtonElement>("#err-e button")[ei]?.click();
    if (open) { const details = document.querySelector<HTMLDetailsElement>("#bank-examples"); if (details) details.open = true; }
    window.dispatchEvent(new CustomEvent("knowledge:error", { detail: { code, questionId: q.id } }));
  }

  function renderCard(): void {
    const skill = SKILLS[selected];
    const path = pathTo(selected);
    const related = ASSOCIATED.has(selected);
    const answer = answers.get(selected);
    const correct = checks.get(selected);
    const kind = selected === "4M2" ? "This question tests" : selected === "5M1" ? "Later learning built on area" : related ? selected === "4M1" ? "Related to this error" : "Named by this question" : "An earlier skill to check";
    card.innerHTML = `<span class="kg-small-label">${kind}</span><h3>${m(skill.label)}</h3><p>${m(skill.why)}</p><nav class="kg-path" aria-label="Selected learning path">${path.map((code, i) => `<button type="button" data-kg-select="${code}">${m(SKILLS[code].label)}</button>${i < path.length - 1 ? '<span aria-hidden="true">↓</span>' : ""}`).join("")}</nav>
      ${selected === "4M2" ? '<div class="kg-choose-branch"><button type="button" data-kg-select="3N4">Explore number skills <span aria-hidden="true">↙</span></button><button type="button" data-kg-select="4S2">Explore shape skills <span aria-hidden="true">↙</span></button></div>' : ""}
      ${probeOpen ? `<div class="kg-probe"><span class="kg-small-label">Try a brief follow-up check</span><p>${m(skill.probe.question)}</p><div role="group" aria-label="Skill check answers">${skill.probe.choices.map((choice, i) => `<button type="button" data-kg-answer="${i}" aria-pressed="${answer === i}" class="${answer === i ? correct ? "is-correct" : "needs-retry" : ""}">${m(choice)}</button>`).join("")}</div><p class="kg-probe-feedback" aria-live="polite">${answer === undefined ? "" : correct ? `✓ ${m(skill.probe.explanation)} This check passed.` : `This response needs another look. ${m(skill.probe.explanation)}`}</p>${correct ? '<a class="kg-return" href="#reward">Check the idea in a fresh area question →</a>' : ""}</div>` : '<button type="button" class="kg-open-probe" data-kg-open-probe>Try a check of this skill →</button>'}`;
  }

  function render(): void {
    frame.innerHTML = treeHtml(selected, associations, checks);
    showLinks.checked = associations;
    root!.querySelector<HTMLElement>("#kg-extra-legend")!.hidden = !associations;
    const item = BANK_CASES[caseIndex];
    root!.querySelector<HTMLElement>("#kg-student-working")!.innerHTML = `${m(item.working)} <span aria-label="wrong step">×</span>`;
    root!.querySelector<HTMLElement>("#kg-error-note")!.textContent = item.note;
    root!.querySelector<HTMLElement>("#kg-explore-error")!.textContent = item.action + " ↙";
    root!.querySelectorAll<HTMLButtonElement>("[data-kg-case]").forEach((button) => button.setAttribute("aria-pressed", String(Number(button.dataset.kgCase) === caseIndex)));
    root!.querySelector<HTMLElement>("#kg-mobile-skills")!.innerHTML = AREA_TOPICS.filter((topic) => associations || !ASSOCIATED.has(topic.code)).map((topic) => `<button type="button" data-kg-select="${topic.code}" aria-pressed="${selected === topic.code}">${m(SKILLS[topic.code].label)}</button>`).join("");
    renderCard();
  }

  function select(code: string): void {
    if (!SKILLS[code]) return;
    selected = code;
    if (ASSOCIATED.has(code)) associations = true;
    probeOpen = false;
    render();
  }

  root.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const caseButton = target.closest<HTMLButtonElement>("[data-kg-case]");
    if (caseButton) {
      caseIndex = Number(caseButton.dataset.kgCase);
      syncBank(false);
      render();
      return;
    }
    if (target.closest("#kg-explore-error")) { select(BANK_CASES[caseIndex].focus); return; }
    const node = target.closest<HTMLElement | SVGElement>("[data-kg-node], [data-kg-select]");
    if (node) {
      const code = node.dataset.kgNode ?? node.dataset.kgSelect;
      if (code) {
        const fromTree = !!node.dataset.kgNode;
        const fromLabel = node.classList.contains("kg-node-label");
        const fromMobile = !!node.closest(".kg-mobile-skills");
        const fromCard = !!node.closest(".kg-skill-card");
        select(code);
        if (fromTree) frame.querySelector<SVGElement>(`[data-kg-node="${code}"]`)?.focus({ preventScroll: true });
        else if (fromLabel) frame.querySelector<HTMLButtonElement>(`[data-kg-select="${code}"]`)?.focus({ preventScroll: true });
        else if (fromMobile) root!.querySelector<HTMLButtonElement>(`.kg-mobile-skills [data-kg-select="${code}"]`)?.focus({ preventScroll: true });
        else if (fromCard) card.querySelector<HTMLButtonElement>(`[data-kg-select="${code}"]`)?.focus({ preventScroll: true });
      }
      return;
    }
    if (target.closest("[data-kg-open-probe]")) {
      probeOpen = true;
      renderCard();
      card.querySelector<HTMLButtonElement>("[data-kg-answer]")?.focus({ preventScroll: true });
      return;
    }
    const answer = target.closest<HTMLButtonElement>("[data-kg-answer]");
    if (answer) {
      const index = Number(answer.dataset.kgAnswer);
      answers.set(selected, index);
      checks.set(selected, index === SKILLS[selected].probe.correct);
      frame.innerHTML = treeHtml(selected, associations, checks);
      renderCard();
      card.querySelector<HTMLButtonElement>(`[data-kg-answer="${index}"]`)?.focus({ preventScroll: true });
      return;
    }
    if (target.closest("[data-kg-open-bank]")) syncBank(true);
  });
  showLinks.addEventListener("change", () => {
    associations = showLinks.checked;
    if (!associations && ASSOCIATED.has(selected)) selected = "4M2";
    probeOpen = false;
    render();
  });
  frame.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    const node = target.closest<SVGElement>("[data-kg-node]");
    if (!node) return;
    event.preventDefault();
    node.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  render();
  subscribeGarden((state) => {
    const evidence = root.querySelector<HTMLElement>("#kg-garden-evidence")!;
    const plan = state.activePlan;
    evidence.hidden = !plan;
    evidence.innerHTML = plan ? `Your garden: ${plan.length} × ${plan.width} m → ${plan.area} m<sup>2</sup>. Prediction: ${plan.prediction} plants. This recorded attempt is separate from the bank example above.` : "";
  });
}

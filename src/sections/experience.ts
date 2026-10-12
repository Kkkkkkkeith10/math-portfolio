export function initExperience(): void {
  // Expand / collapse cards
  document.querySelectorAll<HTMLButtonElement>(".xp__toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      btn.setAttribute("aria-expanded", String(btn.getAttribute("aria-expanded") !== "true"));
    });
  });

  // Filter by kind of work
  const chips = Array.from(document.querySelectorAll<HTMLButtonElement>("#chips button"));
  const cards = Array.from(document.querySelectorAll<HTMLElement>("#xp .xp__card"));
  chips.forEach((chip) =>
    chip.addEventListener("click", () => {
      const tag = chip.dataset.tag ?? "all";
      chips.forEach((c) => c.setAttribute("aria-pressed", String(c === chip)));
      cards.forEach((card) => {
        const tags = (card.dataset.tags ?? "").split(" ");
        card.classList.toggle("dim", tag !== "all" && !tags.includes(tag));
      });
    }),
  );
}

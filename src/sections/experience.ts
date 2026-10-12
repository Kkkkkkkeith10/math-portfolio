export function initExperience(): void {
  document.querySelectorAll<HTMLButtonElement>(".xp__toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      btn.setAttribute("aria-expanded", String(btn.getAttribute("aria-expanded") !== "true"));
    });
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// Helper : injecter la feuille de style d'un web component UNE seule fois.
// ═══════════════════════════════════════════════════════════════════════════
// Nos composants rendent en LIGHT DOM (pas de shadow) pour profiter de la charte
// globale. Le style PROPRE à un composant (ex. .deriv-svg) était dans le
// `<style scoped>` du .vue : on le porte ici, injecté une fois dans <head> via
// un <style id="…"> idempotent. Évite de polluer styles/local.css et garde
// chaque composant auto-suffisant (principe LEGO).
export const injectStyleOnce = (id: string, css: string): void => {
  if (typeof document === "undefined" || document.getElementById(id)) return;
  const style = document.createElement("style");
  style.id = id;
  style.textContent = css;
  document.head.append(style);
};

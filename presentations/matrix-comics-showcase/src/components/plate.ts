// ═══════════════════════════════════════════════════════════════════════════
// <bgpt-plate> — planche encadrée à l'encre, en web component vanilla.
// ═══════════════════════════════════════════════════════════════════════════
// Remplace l'ancien <Plate> Vue. Image à sa taille naturelle (plafond
// `max-height`), cadre encré. On résout la base du chemin nous-mêmes via
// `withBase` (compatible sous-chemin `/microgpt-ts/` en prod ET racine en dev) —
// exactement comme le faisait le composant Vue. Usage :
//   <bgpt-plate src="/comic-dream.jpg" max-height="40vh" />
import { withBase } from "../../lib/asset.js";

export const TAG = "bgpt-plate";

export const register = (): void => {
  if (typeof HTMLElement === "undefined" || customElements.get(TAG)) return;

  class BgptPlate extends HTMLElement {
    static readonly observedAttributes = ["src", "max-height"];

    connectedCallback(): void {
      this.style.display = "contents";
      this.#render();
    }
    attributeChangedCallback(): void {
      this.#render();
    }
    #render(): void {
      const src = withBase(this.getAttribute("src") ?? "");
      const maxHeight = this.getAttribute("max-height") ?? "40vh";
      this.innerHTML = `<div class="plate ink-border"><img src="${src}" alt="" style="max-height: ${maxHeight}" /></div>`;
    }
  }

  customElements.define(TAG, BgptPlate);
};

// ═══════════════════════════════════════════════════════════════════════════
// <bgpt-sfx> — lettrage SFX façon BD, en web component vanilla (zéro framework).
// ═══════════════════════════════════════════════════════════════════════════
// Copie de butterfly-gpt/src/components/sfx.ts (la source de vérité), SEUL
// delta : pas de branche i18n (`text-key` + re-render sur `bgpt:langchange`) —
// la vitrine n'est pas bilingue, le libellé passe toujours par `text` littéral.
// Rend un <span class="sfx …"> en LIGHT DOM (pas de shadow) pour que la charte
// globale (styles/charte.css : .sfx, .sfx-crimson…) s'applique telle quelle.
// Usage en slide :
//   <bgpt-sfx text="POW!" color="crimson" size="1.6rem" />
//   <bgpt-sfx text="BRRRINNNG" vertical />
//
// La classe est définie DANS register() (et non au top-level) pour ne PAS
// référencer HTMLElement au chargement du module : ainsi l'import reste sûr même
// hors navigateur (build/SSR). register() est idempotent.
import { SFX_DEFAULT_COLOR, SFX_DEFAULT_SIZE, sfxClasses } from "./sfx.logic.ts";

export const TAG = "bgpt-sfx";

export const register = (): void => {
  if (typeof HTMLElement === "undefined" || customElements.get(TAG)) return;

  class BgptSfx extends HTMLElement {
    static readonly observedAttributes = ["text", "color", "vertical", "size"];
    readonly #span = document.createElement("span");

    connectedCallback(): void {
      // `contents` : la boîte du host s'efface → le <span.sfx> interne redevient
      // l'élément direct (flex item, ou inline dans un titre/§), EXACTEMENT comme
      // l'ancien <Sfx> Vue (un seul span). Sans ça, le host ajoute un niveau qui
      // casse le flux : il ne pousse plus le texte suivant (slide mort-vivant) et
      // double-imbrique les inline-block (« B . O . S » qui s'empile).
      this.style.display = "contents";
      if (!this.#span.isConnected) this.append(this.#span);
      this.#render();
    }

    attributeChangedCallback(): void {
      this.#render();
    }

    #render(): void {
      const color = this.getAttribute("color") ?? SFX_DEFAULT_COLOR;
      const size = this.getAttribute("size") ?? SFX_DEFAULT_SIZE;
      // On reporte la `class` AUTEUR (ex. `inline-block`) sur le <span> interne,
      // comme Vue fusionnait la classe sur sa racine : sans ça, un texte à
      // espaces (« B . O . S ») casse aux espaces et s'empile (effet vertical).
      const extra = this.getAttribute("class") ?? "";
      this.#span.className = `${sfxClasses(color, this.hasAttribute("vertical"))} ${extra}`.trim();
      this.#span.style.fontSize = size;
      this.#span.textContent = this.getAttribute("text") ?? "";
    }
  }

  customElements.define(TAG, BgptSfx);
};

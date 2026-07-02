// ═══════════════════════════════════════════════════════════════════════════
// <bgpt-sfx> — lettrage SFX façon BD, en web component vanilla (zéro framework).
// ═══════════════════════════════════════════════════════════════════════════
// Remplace l'ancien <Sfx> Vue. Rend un <span class="sfx …"> en LIGHT DOM (pas de
// shadow) pour que la charte globale (styles/charte.css : .sfx, .sfx-crimson…)
// s'applique telle quelle. Usage en slide :
//   <bgpt-sfx text="POW!" color="crimson" size="1.6rem" />
//   <bgpt-sfx text="BRRRINNNG" vertical />
//
// i18n : au lieu d'un `text` littéral, on peut passer `text-key="cover.sharePill"`
// → le SFX résout la chaîne dans le dictionnaire de la langue active (lue sur
// <html lang>) et se re-rend à l'événement `bgpt:langchange`. C'est l'idiome de
// traduction d'un libellé SFX (le binding Vue `:text` ne passe pas le compilateur
// markdown ; un attribut simple résolu par le composant, si).
//
// La classe est définie DANS register() (et non au top-level) pour ne PAS
// référencer HTMLElement au chargement du module : ainsi l'import reste sûr même
// hors navigateur (build/SSR). register() est idempotent.
import { domLang, resolve } from "../../i18n/dict.ts";
import { SFX_DEFAULT_COLOR, SFX_DEFAULT_SIZE, sfxClasses } from "./sfx.logic.ts";

export const TAG = "bgpt-sfx";

export const register = (): void => {
  if (typeof HTMLElement === "undefined" || customElements.get(TAG)) return;

  class BgptSfx extends HTMLElement {
    static readonly observedAttributes = ["text", "text-key", "color", "vertical", "size"];
    readonly #span = document.createElement("span");
    // Re-rend au changement de langue (les web components ne « voient » pas la ref
    // Vue) ; flèche liée pour pouvoir retirer l'écouteur au démontage.
    readonly #onLang = (): void => this.#render();

    connectedCallback(): void {
      // `contents` : la boîte du host s'efface → le <span.sfx> interne redevient
      // l'élément direct (flex item, ou inline dans un titre/§), EXACTEMENT comme
      // l'ancien <Sfx> Vue (un seul span). Sans ça, le host ajoute un niveau qui
      // casse le flux : il ne pousse plus le texte suivant (slide mort-vivant) et
      // double-imbrique les inline-block (« B . O . S » qui s'empile).
      this.style.display = "contents";
      if (!this.#span.isConnected) this.append(this.#span);
      window.addEventListener("bgpt:langchange", this.#onLang);
      this.#render();
    }

    disconnectedCallback(): void {
      window.removeEventListener("bgpt:langchange", this.#onLang);
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
      // `text-key` (clé i18n) prime sur `text` (littéral) : libellé traduit.
      const key = this.getAttribute("text-key");
      this.#span.textContent = key ? resolve(domLang(), key) : (this.getAttribute("text") ?? "");
    }
  }

  customElements.define(TAG, BgptSfx);
};

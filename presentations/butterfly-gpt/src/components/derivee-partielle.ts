// ═══════════════════════════════════════════════════════════════════════════
// <bgpt-derivee-partielle> — le parterre L×H, moteur de rendu piloté Datastar.
// ═══════════════════════════════════════════════════════════════════════════
// Lit les attributs `l`, `h`, `active` (reliés par la slide aux signaux via
// data-attr:l="$l" …) et redessine le rectangle + la bande marginale du côté
// poussé. Géométrie depuis derivee-partielle.logic.ts. Light DOM (charte .part-svg).
// NB : signaux/attributs en MINUSCULES — les attributs HTML sont lowercasés.
import {
  baseY,
  fmt,
  PAD_L,
  PAD_R,
  rectHOf,
  rectWOf,
  rectYOf,
  STRIP,
  VIEW_H,
  VIEW_W,
} from "./derivee-partielle.logic.ts";
import { injectStyleOnce } from "./style.ts";

export const TAG = "bgpt-derivee-partielle";

// Styles portés depuis l'ancien <style scoped> de DeriveePartiellePapillon.vue.
const CSS = `
.part { display: flex; flex-direction: column; gap: 0.5rem; }
.part-svg { width: 100%; height: auto; border: 3px solid var(--ink); border-radius: 3px;
  box-shadow: 6px 6px 0 var(--ink);
  background: radial-gradient(var(--amber) 1.2px, transparent 1.3px) 0 0 / 11px 11px,
    linear-gradient(180deg, #fdf6e6 0%, #f6ead0 100%); touch-action: none; }
.part .axis { stroke: var(--ink); stroke-width: 1.5; opacity: 0.25; }
.part .garden { fill: var(--teal); fill-opacity: 0.18; stroke: var(--teal); stroke-width: 3; }
.part .strip-l { fill: var(--teal); fill-opacity: 0.85; stroke: var(--ink); stroke-width: 1.5; }
.part .strip-h { fill: var(--amber); fill-opacity: 0.9; stroke: var(--ink); stroke-width: 1.5; }
.part .bug { font-size: 26px; user-select: none; }
.part .dim { font-size: 12px; fill: var(--ink); opacity: 0.7; font-family: "Fira Code", monospace; }
.part .ctrl { display: flex; align-items: center; gap: 0.6rem; }
.part .ctrl input { flex: 1; }
.part .ctrl input.slider-l { accent-color: var(--teal); }
.part .ctrl input.slider-h { accent-color: var(--amber); }
.part .readout { display: flex; align-items: center; gap: 0.5rem; font-size: 0.95rem; }
`;

const renderSvg = (l: number, h: number, active: string): string => {
  const n = (v: number): string => v.toFixed(1);
  const rw = rectWOf(l);
  const rh = rectHOf(h);
  const ry = rectYOf(h);

  const strip =
    active === "L"
      ? `<rect x="${n(PAD_L + rw)}" y="${n(ry)}" width="${STRIP}" height="${n(rh)}" class="strip-l" />`
      : active === "H"
        ? `<rect x="${PAD_L}" y="${n(ry - STRIP)}" width="${n(rw)}" height="${STRIP}" class="strip-h" />`
        : "";

  return (
    `<svg class="part-svg" viewBox="0 0 ${VIEW_W} ${VIEW_H}">` +
    `<line x1="${PAD_L}" y1="${baseY}" x2="${VIEW_W - PAD_R}" y2="${baseY}" class="axis" />` +
    `<rect x="${PAD_L}" y="${n(ry)}" width="${n(rw)}" height="${n(rh)}" class="garden" />` +
    strip +
    `<text x="${n(PAD_L + rw / 2)}" y="${n(ry + rh / 2 + 9)}" class="bug" text-anchor="middle">🦋</text>` +
    `<text x="${n(PAD_L + rw / 2)}" y="${baseY + 20}" class="dim" text-anchor="middle">L = ${fmt(l)}</text>` +
    `<text x="${PAD_L - 10}" y="${n(ry + rh / 2 + 4)}" class="dim" text-anchor="end">H = ${fmt(h)}</text>` +
    `</svg>`
  );
};

export const register = (): void => {
  if (typeof HTMLElement === "undefined" || customElements.get(TAG)) return;
  injectStyleOnce("bgpt-derivee-partielle-style", CSS);

  class BgptDeriveePartielle extends HTMLElement {
    static readonly observedAttributes = ["l", "h", "active"];
    readonly #onLang = (): void => this.#render();

    connectedCallback(): void {
      this.style.display = "contents";
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
      const l = Number(this.getAttribute("l") ?? "5");
      const h = Number(this.getAttribute("h") ?? "3");
      const active = this.getAttribute("active") ?? "L";
      this.innerHTML = renderSvg(Number.isFinite(l) ? l : 5, Number.isFinite(h) ? h : 3, active);
    }
  }

  customElements.define(TAG, BgptDeriveePartielle);
};

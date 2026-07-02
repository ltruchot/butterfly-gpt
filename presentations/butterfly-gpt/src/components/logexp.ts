// ═══════════════════════════════════════════════════════════════════════════
// <bgpt-logexp> — scène SVG « exp et ln sont inverses », pilotée par Datastar.
// ═══════════════════════════════════════════════════════════════════════════
// Le web component est le MOTEUR DE RENDU : il lit l'attribut `x` (que la slide
// relie au signal via data-attr:x="$x") et redessine le SVG. La réactivité (le
// curseur, le signal) vit côté Datastar dans la slide. Toute la géométrie vient
// de logexp.logic.ts (pur, testé). Light DOM → la charte .logexp-svg s'applique.
import {
  expCurveEndX,
  expPath,
  exOf,
  lnCurveEndY,
  lnPath,
  M,
  mX,
  mY,
  TICKS,
  VIEW_H,
  VIEW_W,
  X_MAX,
  X_MIN,
} from "./logexp.logic.ts";

export const TAG = "bgpt-logexp";

// Construit la chaîne SVG complète pour une valeur de x donnée. Pur (string →
// string) : les parties fixes (repère, courbes) + les parties mobiles (les deux
// papillons en miroir et leurs pointillés).
const renderSvg = (xRaw: number): string => {
  const x = Math.max(X_MIN, Math.min(X_MAX, xRaw));
  const ex = exOf(x);
  const n = (v: number): string => v.toFixed(1);

  const grid = TICKS.map(
    (i) =>
      `<line x1="${n(mX(i))}" y1="${n(mY(0))}" x2="${n(mX(i))}" y2="${n(mY(M))}" />` +
      `<line x1="${n(mX(0))}" y1="${n(mY(i))}" x2="${n(mX(M))}" y2="${n(mY(i))}" />`,
  ).join("");

  const ticks =
    `<text x="${n(mX(0) - 7)}" y="${n(mY(0) + 13)}" class="tick-lbl" text-anchor="end">0</text>` +
    TICKS.map(
      (i) =>
        `<line x1="${n(mX(i))}" y1="${n(mY(0))}" x2="${n(mX(i))}" y2="${n(mY(0) + 5)}" />` +
        `<text x="${n(mX(i))}" y="${n(mY(0) + 16)}" class="tick-lbl" text-anchor="middle">${i}</text>` +
        `<line x1="${n(mX(0))}" y1="${n(mY(i))}" x2="${n(mX(0) - 5)}" y2="${n(mY(i))}" />` +
        `<text x="${n(mX(0) - 8)}" y="${n(mY(i) + 4)}" class="tick-lbl" text-anchor="end">${i}</text>`,
    ).join("");

  return (
    `<svg class="logexp-svg" viewBox="0 0 ${VIEW_W} ${VIEW_H}">` +
    `<line x1="${n(mX(0))}" y1="${n(mY(0))}" x2="${n(mX(M))}" y2="${n(mY(0))}" class="axis" />` +
    `<line x1="${n(mX(0))}" y1="${n(mY(0))}" x2="${n(mX(0))}" y2="${n(mY(M))}" class="axis" />` +
    `<g class="grid">${grid}</g>` +
    `<g class="ticks">${ticks}</g>` +
    `<line x1="${n(mX(0))}" y1="${n(mY(0))}" x2="${n(mX(M))}" y2="${n(mY(M))}" class="mirror" />` +
    `<path d="${expPath()}" class="curve-exp" />` +
    `<path d="${lnPath()}" class="curve-ln" />` +
    `<text x="${n(mX(expCurveEndX) + 6)}" y="${n(mY(M) + 4)}" class="lbl-exp">exp</text>` +
    `<text x="${n(mX(M) + 2)}" y="${n(mY(lnCurveEndY) + 4)}" class="lbl-ln">ln</text>` +
    `<circle cx="${n(mX(0))}" cy="${n(mY(1))}" r="3.5" class="anchor anchor-exp" />` +
    `<text x="${n(mX(0) + 7)}" y="${n(mY(1) - 5)}" class="anchor-lbl" style="fill: var(--amber)">exp(0)=1</text>` +
    `<circle cx="${n(mX(1))}" cy="${n(mY(0))}" r="3.5" class="anchor anchor-ln" />` +
    `<text x="${n(mX(1) + 6)}" y="${n(mY(0) - 7)}" class="anchor-lbl" style="fill: var(--teal)">ln(1)=0</text>` +
    // ── parties mobiles : les deux papillons en miroir ──
    `<line x1="${n(mX(x))}" y1="${n(mY(ex))}" x2="${n(mX(ex))}" y2="${n(mY(x))}" class="link" />` +
    `<line x1="${n(mX(x))}" y1="${n(mY(ex))}" x2="${n(mX(x))}" y2="${n(mY(0))}" class="drop drop-exp" />` +
    `<text x="${n(mX(x))}" y="${n(mY(ex) - 6)}" class="bug" text-anchor="middle">🦋</text>` +
    `<text x="${n(mX(x) + 14)}" y="${n(mY(ex) - 2)}" class="tag-exp">exp</text>` +
    `<line x1="${n(mX(ex))}" y1="${n(mY(x))}" x2="${n(mX(0))}" y2="${n(mY(x))}" class="drop drop-ln" />` +
    `<text x="${n(mX(ex))}" y="${n(mY(x) - 6)}" class="bug" text-anchor="middle">🦋</text>` +
    `<text x="${n(mX(ex) + 12)}" y="${n(mY(x) + 14)}" class="tag-ln">ln</text>` +
    `</svg>`
  );
};

export const register = (): void => {
  if (typeof HTMLElement === "undefined" || customElements.get(TAG)) return;

  class BgptLogexp extends HTMLElement {
    static readonly observedAttributes = ["x"];

    connectedCallback(): void {
      // `contents` : la boîte du host s'efface, le <svg> devient enfant direct
      // de .stage (flex) → le layout reste identique à l'ancien composant Vue.
      this.style.display = "contents";
      this.#render();
    }
    attributeChangedCallback(): void {
      this.#render();
    }
    #render(): void {
      const x = Number(this.getAttribute("x") ?? "1");
      this.innerHTML = renderSvg(Number.isFinite(x) ? x : 1);
    }
  }

  customElements.define(TAG, BgptLogexp);
};

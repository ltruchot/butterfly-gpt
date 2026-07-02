// ═══════════════════════════════════════════════════════════════════════════
// <bgpt-derivee> — scène SVG « la dérivée = la vitesse de la pente », pilotée
// par Datastar (attribut `t` relié au signal $t). Moteur de rendu pur.
// ═══════════════════════════════════════════════════════════════════════════
import { domLang } from "../../i18n/dict.ts";
import {
  curvePath,
  h,
  hToY,
  H_MIN,
  PAD_R,
  PAD_T,
  T_MIN,
  tangentOf,
  tFromViewBoxX,
  tToX,
  VIEW_H,
  VIEW_W,
  X_TICKS,
  Y_TICKS,
} from "./derivee.logic.ts";

export const TAG = "bgpt-derivee";

// Libellé de l'axe du temps (« altitude (m) ↑ » est identique dans les 2 langues).
const TIME_AXIS = { fr: "temps (s) →", en: "time (s) →" } as const;

const renderSvg = (tRaw: number): string => {
  const t = Math.max(T_MIN, Math.min(10, tRaw));
  const n = (v: number): string => v.toFixed(1);
  const y0 = hToY(H_MIN); // le sol
  const x0 = tToX(T_MIN); // l'axe vertical

  const xTicks = X_TICKS.map(
    (v) =>
      `<line x1="${n(tToX(v))}" y1="${n(y0)}" x2="${n(tToX(v))}" y2="${n(y0 + 5)}" class="tick" />` +
      `<text x="${n(tToX(v))}" y="${n(y0 + 17)}" text-anchor="middle" class="axis-val">${v}</text>`,
  ).join("");

  const yTicks = Y_TICKS.map(
    (v) =>
      `<line x1="${n(x0 - 5)}" y1="${n(hToY(v))}" x2="${n(x0)}" y2="${n(hToY(v))}" class="tick" />` +
      `<text x="${n(x0 - 8)}" y="${n(hToY(v) + 3.5)}" text-anchor="end" class="axis-val">${v}</text>`,
  ).join("");

  const tg = tangentOf(t);

  return (
    `<svg class="deriv-svg" viewBox="0 0 ${VIEW_W} ${VIEW_H}">` +
    `<line x1="${n(x0)}" y1="${n(y0)}" x2="${n(VIEW_W - PAD_R)}" y2="${n(y0)}" class="axis-line" />` +
    `<line x1="${n(x0)}" y1="${n(y0)}" x2="${n(x0)}" y2="${n(PAD_T)}" class="axis-line" />` +
    xTicks +
    yTicks +
    `<text x="${n(x0 - 6)}" y="${n(PAD_T - 8)}" text-anchor="start" class="axis-name">altitude (m) ↑</text>` +
    `<text x="${n(VIEW_W - PAD_R)}" y="${n(VIEW_H - 6)}" text-anchor="end" class="axis-name">${TIME_AXIS[domLang()]}</text>` +
    `<path d="${curvePath()}" class="curve" />` +
    `<line x1="${n(tg.x1)}" y1="${n(tg.y1)}" x2="${n(tg.x2)}" y2="${n(tg.y2)}" class="tangent" />` +
    `<text x="${n(tToX(t))}" y="${n(hToY(h(t)) + 8)}" class="bug" text-anchor="middle">🦋</text>` +
    `</svg>`
  );
};

export const register = (): void => {
  if (typeof HTMLElement === "undefined" || customElements.get(TAG)) return;

  class BgptDerivee extends HTMLElement {
    static readonly observedAttributes = ["t"];
    #dragging = false;
    readonly #onLang = (): void => this.#render();

    connectedCallback(): void {
      // Host = vraie boîte (pas `contents`) : surface STABLE pour le glisser —
      // le SVG interne est remplacé à chaque rendu, mais le host (et donc la
      // capture de pointeur + les listeners) survit.
      this.style.display = "block";
      this.style.touchAction = "none";
      this.style.cursor = "grab";
      this.addEventListener("pointerdown", this.#onDown);
      this.addEventListener("pointermove", this.#onMove);
      this.addEventListener("pointerup", this.#onUp);
      this.addEventListener("pointerleave", this.#onUp);
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
      const t = Number(this.getAttribute("t") ?? "2");
      this.innerHTML = renderSvg(Number.isFinite(t) ? t : 2);
    }

    // ── Glisser le papillon : pointeur → t → on POUSSE la valeur dans le signal
    //    Datastar $t (via dataset + event `drag-t` que la slide écoute avec
    //    `data-on:drag-t="$t = el.dataset.dragT"`). Le slider (data-bind:t) suit
    //    alors tout seul, comme avant. ─────────────────────────────────────────
    #onDown = (e: PointerEvent): void => {
      this.#dragging = true;
      this.setPointerCapture(e.pointerId);
      this.#emitT(e);
    };
    #onMove = (e: PointerEvent): void => {
      if (this.#dragging) this.#emitT(e);
    };
    #onUp = (e: PointerEvent): void => {
      this.#dragging = false;
      if (this.hasPointerCapture(e.pointerId)) this.releasePointerCapture(e.pointerId);
    };
    #emitT(e: PointerEvent): void {
      const svg = this.querySelector("svg");
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      if (!rect.width) return;
      const xPix = ((e.clientX - rect.left) / rect.width) * VIEW_W; // clientX → viewBox
      this.dataset.dragT = String(tFromViewBoxX(xPix));
      this.dispatchEvent(new Event("drag-t", { bubbles: true }));
    }
  }

  customElements.define(TAG, BgptDerivee);
};

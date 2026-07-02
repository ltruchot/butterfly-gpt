// ═══════════════════════════════════════════════════════════════════════════
// <bgpt-chaine-ramifiee> — la règle de la chaîne multivariable, moteur de rendu.
// ═══════════════════════════════════════════════════════════════════════════
// Lit les attributs nvelo/nvoiture/bike/car (reliés par la slide aux signaux via
// data-attr) et redessine les 6 trajets (chacun = base × facteur du mode) entre
// le nœud départ 🏡 et l'arrivée 🏢. Géométrie + facteurs depuis
// chaine-ramifiee.logic.ts. Light DOM (charte .ram-svg). NB : attributs en
// minuscules (les attributs HTML sont lowercasés).
import { domLang } from "../../i18n/dict.ts";
import {
  BASE_KMH,
  EX,
  MIDX,
  MY,
  nPiedOf,
  SX,
  tripsOf,
  W,
  H as VIEW_H,
} from "./chaine-ramifiee.logic.ts";
import { injectStyleOnce } from "./style.ts";

export const TAG = "bgpt-chaine-ramifiee";

// Libellés des deux nœuds (la base partagée 🏡 et le travail 🏢), bilingues.
const HUB_TXT = {
  fr: { speed: "ma vitesse", work: "le travail" },
  en: { speed: "my speed", work: "work" },
} as const;

// Styles portés depuis l'ancien <style scoped> de ChaineRamifiee.vue.
const CSS = `
.ram { display: flex; flex-direction: column; gap: 0.2rem; }
.ram-svg { width: 100%; height: auto; border: 3px solid var(--ink); border-radius: 3px;
  box-shadow: 6px 6px 0 var(--ink);
  background: radial-gradient(#d7c9a3 1.2px, transparent 1.3px) 0 0 / 13px 13px,
    linear-gradient(180deg, #eef6e7 0%, #e7efdc 100%); }
.ram .dirt { stroke-width: 3.5; stroke-dasharray: 2 7; stroke-linecap: round; opacity: 0.85; }
.ram .hub { stroke: var(--ink); stroke-width: 3; }
.ram .hub.start { fill: #fff; }
.ram .hub.end { fill: var(--amber); fill-opacity: 0.4; }
.ram .hub-lbl { font-size: 12px; font-family: "Fira Code", monospace; fill: var(--ink); opacity: 0.8; }
.ram .hub-sub { font-size: 12px; font-family: "Anton", sans-serif; fill: var(--teal); }
.ram .emoji-lg { font-size: 26px; user-select: none; }
.ram .emoji { font-size: 20px; user-select: none; }
.ram .lab-bg { fill: var(--paper); stroke-width: 1.4; }
.ram .lab { font-size: 12px; font-family: "Fira Code", monospace; font-weight: 700; }
.ram .note { margin: 0; font-size: 0.8rem; color: var(--slate); }
.ram .foot { margin: 0.1rem 0 0; font-size: 0.8rem; color: var(--teal); }
.ram .ctrl { display: flex; align-items: center; gap: 0.5rem; }
.ram .ctrl input { flex: 1; min-width: 0; }
.ram .ctrl input.sl-velo { accent-color: var(--amber); }
.ram .ctrl input.sl-voit { accent-color: var(--crimson); }
.ram .readout { display: flex; align-items: center; gap: 0.5rem; font-size: 1rem; }
`;

const esc = (s: string): string => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

const renderSvg = (nVelo: number, nVoiture: number, bike: number, car: number): string => {
  const trips = tripsOf(nPiedOf(nVelo, nVoiture), nVelo, nVoiture, bike, car);
  const txt = HUB_TXT[domLang()];

  // chaque trajet : la piste pointillée courbe + l'emoji du mode + son facteur
  const paths = trips
    .map(
      (t) =>
        `<path d="M${SX},${MY} Q${MIDX},${2 * t.ay - MY} ${EX},${MY}" class="dirt" stroke="${t.color}" fill="none" />`,
    )
    .join("");
  const labels = trips
    .map(
      (t) =>
        `<text x="${MIDX - 30}" y="${t.ay + 6}" class="emoji" text-anchor="middle">${t.emoji}</text>` +
        `<rect x="${MIDX - 4}" y="${t.ay - 11}" width="54" height="19" rx="3" class="lab-bg" stroke="${t.color}" />` +
        `<text x="${MIDX + 23}" y="${t.ay + 3}" class="lab" fill="${t.color}" text-anchor="middle">${esc(t.label)}</text>`,
    )
    .join("");

  return (
    `<svg class="ram-svg" viewBox="0 0 ${W} ${VIEW_H}">` +
    paths +
    labels +
    // 🏡 ma vitesse de base (le nœud PARTAGÉ, fixe)
    `<circle cx="${SX}" cy="${MY}" r="26" class="hub start" />` +
    `<text x="${SX}" y="${MY + 8}" class="emoji-lg" text-anchor="middle">🏡</text>` +
    `<text x="${SX}" y="${MY + 42}" class="hub-lbl" text-anchor="middle">${txt.speed}</text>` +
    `<text x="${SX}" y="${MY + 58}" class="hub-sub" text-anchor="middle">${BASE_KMH} km/h</text>` +
    // 🏢 le travail (l'arrivée)
    `<circle cx="${EX}" cy="${MY}" r="26" class="hub end" />` +
    `<text x="${EX}" y="${MY + 8}" class="emoji-lg" text-anchor="middle">🏢</text>` +
    `<text x="${EX}" y="${MY + 42}" class="hub-lbl" text-anchor="middle">${txt.work}</text>` +
    `</svg>`
  );
};

export const register = (): void => {
  if (typeof HTMLElement === "undefined" || customElements.get(TAG)) return;
  injectStyleOnce("bgpt-chaine-ramifiee-style", CSS);

  class BgptChaineRamifiee extends HTMLElement {
    static readonly observedAttributes = ["nvelo", "nvoiture", "bike", "car"];
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
      const num = (name: string, dflt: number): number => {
        const v = Number(this.getAttribute(name) ?? String(dflt));
        return Number.isFinite(v) ? v : dflt;
      };
      this.innerHTML = renderSvg(
        num("nvelo", 2),
        num("nvoiture", 2),
        num("bike", 4),
        num("car", 2),
      );
    }
  }

  customElements.define(TAG, BgptChaineRamifiee);
};

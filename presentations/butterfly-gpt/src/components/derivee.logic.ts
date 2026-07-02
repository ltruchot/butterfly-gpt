// ═══════════════════════════════════════════════════════════════════════════
// Logique pure de la « dérivée papillon » : un papillon porté par un courant
// d'air chaud, et la TANGENTE qui mesure sa vitesse de montée.
// ═══════════════════════════════════════════════════════════════════════════
// POURQUOI (intuition) : la dérivée, c'est « la vitesse de la pente ». On suit
// l'altitude h(t) d'un papillon qui monte de plus en plus DOUCEMENT, jusqu'à un
// palier plat. La tangente posée sur la courbe penche d'autant plus qu'il monte
// vite ; sa pente EST la dérivée h'(t). Quand le courant faiblit, la pente tend
// vers 0. C'est la brique de tout l'apprentissage : savoir « dans quel sens et à
// quelle vitesse » une sortie bouge quand on pousse une entrée.
//
// Tout le calcul est isolé ici (zéro DOM, hors i18n) pour être testé seul. Les
// fonctions d'affichage prennent une `lang` (défaut `domLang()` au runtime).
import { domLang, type Lang, locale } from "../../i18n/dict.ts";

// ── Modèle : une montée qui ralentit, puis un palier plat ─────────────────────
// Pour t < TV : demi-parabole montante dont la pente faiblit ; pour t ≥ TV : plat.
//   h(t) = H_TOP − K·(TV − t)²      →      h'(t) = 2K·(TV − t)   (≥ 0, décroît)
export const T_MIN = 0;
export const T_MAX = 10;
const TV = 8; // instant où la montée s'arrête (palier)
const K = 0.125;
const H_TOP = 8; // altitude du palier

export const h = (x: number): number => (x < TV ? H_TOP - K * (TV - x) ** 2 : H_TOP);
export const hPrime = (x: number): number => (x < TV ? 2 * K * (TV - x) : 0);

// ── Repère pixels ─────────────────────────────────────────────────────────────
export const VIEW_W = 560;
export const VIEW_H = 320;
const PAD_L = 36;
export const PAD_R = 30;
export const PAD_T = 30;
const PAD_B = 44;
export const H_MIN = 0;
const H_MAX = 9;

// graduations chiffrées des axes
export const X_TICKS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
export const Y_TICKS = [0, 2, 4, 6, 8];

export const tToX = (x: number): number =>
  PAD_L + ((x - T_MIN) / (T_MAX - T_MIN)) * (VIEW_W - PAD_L - PAD_R);
export const hToY = (a: number): number =>
  VIEW_H - PAD_B - ((a - H_MIN) / (H_MAX - H_MIN)) * (VIEW_H - PAD_T - PAD_B);

// on n'affiche que des entiers, pour simplifier la lecture
export const fmt = (n: number, lang: Lang = domLang()): string =>
  Math.round(n).toLocaleString(locale(lang));

// ── Courbe échantillonnée → attribut `d` (constante : ne dépend pas de t) ──────
export const curvePath = (): string => {
  const pts: string[] = [];
  for (let i = 0; i <= 120; i++) {
    const x = T_MIN + (i / 120) * (T_MAX - T_MIN);
    pts.push(`${i === 0 ? "M" : "L"}${tToX(x).toFixed(1)},${hToY(h(x)).toFixed(1)}`);
  }
  return pts.join(" ");
};

// ── Tangente : segment centré sur le papillon. On convertit la pente « monde »
//    (altitude/temps) en pente « pixels » pour tenir compte du ratio d'aspect. ──
export type Segment = {
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
};

export const tangentOf = (t: number): Segment => {
  const px = tToX(t);
  const py = hToY(h(t));
  const slope = hPrime(t);
  const dxPerT = (VIEW_W - PAD_L - PAD_R) / (T_MAX - T_MIN);
  const dyPerH = -(VIEW_H - PAD_T - PAD_B) / (H_MAX - H_MIN);
  const pxSlope = (dyPerH * slope) / dxPerT;
  const half = 90; // demi-longueur du trait, en pixels horizontaux
  return { x1: px - half, y1: py - pxSlope * half, x2: px + half, y2: py + pxSlope * half };
};

// ── Libellé pédagogique : la montée est de plus en plus douce, jamais de descente
const PHASE_TXT: Record<Lang, Record<"flat" | "fast" | "slowing", string>> = {
  fr: {
    flat: "≈ 0 : le courant faiblit, il se stabilise",
    fast: "▲ il monte vite",
    slowing: "▲ il monte, mais ralentit",
  },
  en: {
    flat: "≈ 0: the updraft fades, it stabilizes",
    fast: "▲ rising fast",
    slowing: "▲ rising, but slowing",
  },
};

export const phaseOf = (slope: number, lang: Lang = domLang()): string => {
  const txt = PHASE_TXT[lang];
  if (slope < 0.15) return txt.flat;
  return slope > 1 ? txt.fast : txt.slowing;
};
export const phaseColorOf = (slope: number): string =>
  slope < 0.15 ? "var(--amber)" : "var(--teal)";

// ── Interaction : une abscisse viewBox (déjà convertie depuis clientX) → t,
//    bornée dans [T_MIN, T_MAX]. ────────────────────────────────────────────────
export const tFromViewBoxX = (xPix: number): number => {
  const ratio = (xPix - PAD_L) / (VIEW_W - PAD_L - PAD_R);
  return Math.max(T_MIN, Math.min(T_MAX, T_MIN + ratio * (T_MAX - T_MIN)));
};

// ── Accesseurs d'AFFICHAGE pour le markup Datastar (tolèrent un t en chaîne) ───
// `$t` arrive en string depuis un <input range> → on recaste.
export const slopeStr = (t: number | string): string => fmt(hPrime(Number(t))); // δ (entier)
export const phaseTextOf = (t: number | string): string => phaseOf(hPrime(Number(t)));
export const phaseColorTextOf = (t: number | string): string => phaseColorOf(hPrime(Number(t)));

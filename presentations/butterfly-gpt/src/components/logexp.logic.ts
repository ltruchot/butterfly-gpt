// ═══════════════════════════════════════════════════════════════════════════
// Logique pure de la scène « exp et ln sont inverses » (papillons en miroir).
// ═══════════════════════════════════════════════════════════════════════════
// POURQUOI (intuition) : exp envoie un petit nombre x très haut (eˣ) ; ln fait
// le chemin inverse et redonne le petit nombre. Comme ce sont les MÊMES deux
// nombres lus à l'endroit puis à l'envers, les deux courbes sont l'image l'une
// de l'autre dans le miroir de la diagonale y = x. On isole ici TOUT le calcul
// géométrique (repère + tracé des courbes) — zéro DOM, zéro dépendance — pour le
// tester seul ; le composant ne fait ensuite que brancher le curseur et afficher.
import { domLang, type Lang, locale } from "../../i18n/dict.ts";

// ── Repère carré (en unités math) : un côté carré est INDISPENSABLE pour que le
//    miroir y = x apparaisse à 45° et que les deux papillons soient de vrais
//    symétriques. ───────────────────────────────────────────────────────────
export const M = 6.5; // borne des deux axes
export const TICKS: readonly number[] = [1, 2, 3, 4, 5, 6]; // graduations entières (le 0 est à l'origine)
export const X_MIN = 0.1;
export const X_MAX = 1.83; // e^1.83 ≈ 6,23 → le papillon exp reste dans le cadre

export const VIEW_W = 356;
export const VIEW_H = 356;
export const PAD_L = 38;
export const PAD_R = 18;
export const PAD_B = 38;
export const SIDE = VIEW_W - PAD_L - PAD_R; // = 300, côté carré du repère

// math → pixels. mX croît vers la droite ; mY est inversé (l'écran descend).
export const mX = (u: number): number => PAD_L + (u / M) * SIDE;
export const mY = (v: number): number => VIEW_H - PAD_B - (v / M) * SIDE;

// Formate un nombre : 2 décimales par défaut (virgule FR « 2,72 » / point EN « 2.72 »).
export const fmt = (n: number, lang: Lang = domLang(), dec = 2): string =>
  n.toLocaleString(locale(lang), { maximumFractionDigits: dec, minimumFractionDigits: dec });

// Là où chaque courbe atteint le plafond M du cadre : exp plafonne en x = ln(M),
// ln plafonne en y = ln(M) (les deux mêmes, par symétrie).
export const expCurveEndX = Math.log(M);
export const lnCurveEndY = Math.log(M);

// ── Les deux courbes inverses, échantillonnées → attribut SVG `d` ──────────────
// 121 points (i = 0..120). Fonctions PURES et DÉTERMINISTES : même appel → même
// chaîne, ce qui les rend testables exactement.
export const expPath = (samples = 120): string => {
  const pts: string[] = [];
  for (let i = 0; i <= samples; i++) {
    const u = (i / samples) * expCurveEndX;
    pts.push(`${i === 0 ? "M" : "L"}${mX(u).toFixed(1)},${mY(Math.exp(u)).toFixed(1)}`);
  }
  return pts.join(" ");
};

export const lnPath = (samples = 120): string => {
  const pts: string[] = [];
  for (let i = 0; i <= samples; i++) {
    const u = 1 + (i / samples) * (M - 1); // ln(1) = 0, image miroir de exp
    pts.push(`${i === 0 ? "M" : "L"}${mX(u).toFixed(1)},${mY(Math.log(u)).toFixed(1)}`);
  }
  return pts.join(" ");
};

// ── eˣ + accesseurs d'AFFICHAGE (pour le markup Datastar de la slide) ──────────
// `$x` peut arriver en chaîne (valeur d'un <input range>) → on recaste.
export const exOf = (x: number | string): number => Math.exp(Number(x));
export const xStr = (x: number | string): string => fmt(Number(x));
export const exStr = (x: number | string): string => fmt(exOf(x));

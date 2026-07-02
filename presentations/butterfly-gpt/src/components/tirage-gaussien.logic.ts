// ═══════════════════════════════════════════════════════════════════════════
// Logique pure du TIRAGE GAUSSIEN (jeu de fléchettes) — Box-Muller.
// ═══════════════════════════════════════════════════════════════════════════
// POURQUOI (intuition) : on reproduit la VRAIE formule de 04-parameters.ts.
// Deux tirages PLATS u1, u2 (uniformes) deviennent une cloche une fois projetés
// sur une cible 2D :
//   radius = √(−2·ln u1)   (la distance au centre : petite souvent, grande rare)
//   angle  = 2π·u2         (la direction, un tour complet)
//   x      = radius·cos(angle)·σ   (l'ombre horizontale de l'impact = gaussienne)
// Zéro dépendance, tout est déterministe (RNG mulberry32 graine fixe) → testable.

// ── Repère pixel de la cible (centre = 0) ───────────────────────────────────
export const W = 300; // largeur de la cible
export const CY = 116; // y du centre (= 0)
export const CX = 150; // x du centre
export const FRAME = 0.3; // demi-largeur visible, en « valeur » (nos poids ~ ±0.24)
export const PXU = (CY - 12) / FRAME; // pixels par unité de valeur (cadre carré)
export const RINGS = [0.1, 0.2, 0.3] as const; // anneaux FIXES en valeur → on VOIT σ étaler le nuage
export const BINS = 29; // nombre de barres de l'histogramme
export const CAP = 10000; // limite dure : on ne dessine jamais plus de 10000 impacts

export const toX = (v: number): number => CX + v * PXU;
export const toY = (v: number): number => CY - v * PXU;

// Format « code » (toujours en-US, comme dans le reste des fences) — un nombre de
// formule, pas de la prose, donc pas de localisation FR/EN.
export const fmt = (n: number, dec = 2): string =>
  Number(n).toLocaleString("en-US", { maximumFractionDigits: dec, minimumFractionDigits: dec });

// Un tir : les deux tirages plats + leur transformation polaire + l'impact (zx, zy)
// en unités standard (avant mise à l'échelle par σ).
export type Shot = {
  readonly u1: number;
  readonly u2: number;
  readonly r: number;
  readonly a: number;
  readonly zx: number;
  readonly zy: number;
};

// mulberry32 : un hasard REPRODUCTIBLE, sans dépendance (dupliqué inline comme en
// 5c). On renvoie une CLÔTURE à état → la séquence avance d'appel en appel.
export const makeRng = (seed = 7): (() => number) => {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

// Un tir = Box-Muller appliqué à deux tirages plats consécutifs du RNG fourni.
export const draw = (rng: () => number): Shot => {
  const u1 = 1 - rng(); // 1 − rng() évite log(0)
  const u2 = rng();
  const r = Math.sqrt(-2 * Math.log(u1)); // le rayon (loi « exponentielle »)
  const a = 2 * Math.PI * u2; // l'angle
  return { u1, u2, r, a, zx: r * Math.cos(a), zy: r * Math.sin(a) };
};

// L'angle du dernier tir en degrés (libellé de lecture).
export const degOf = (a: number): string => ((a * 180) / Math.PI).toFixed(0);

// Une barre de l'histogramme des ombres (projection sur l'axe x → la cloche).
export type Bar = {
  readonly i: number;
  readonly c: number;
  readonly h: number;
  readonly x: number;
  readonly w: number;
};

// Histogramme des ombres : on somme TOUS les tirs (pas seulement les dessinés) →
// la cloche s'affine jusqu'au plafond CAP (10 000 tirs, cf. tirage-gaussien.ts).
// Bins FIXES sur [−FRAME, +FRAME].
export const histogram = (samples: readonly Shot[], sigma: number): Bar[] => {
  const counts: number[] = Array.from({ length: BINS }, () => 0);
  for (const d of samples) {
    const x = d.zx * sigma;
    const idx = Math.floor(((x + FRAME) / (2 * FRAME)) * BINS);
    if (idx >= 0 && idx < BINS) counts[idx] += 1;
  }
  const max = Math.max(1, ...counts);
  const barW = (2 * FRAME * PXU) / BINS;
  return counts.map((c, i) => ({ i, c, h: (c / max) * 46, x: toX(-FRAME) + i * barW, w: barW }));
};

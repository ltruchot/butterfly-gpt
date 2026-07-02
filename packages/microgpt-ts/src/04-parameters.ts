// ======================================================================
// 04 - Parameters : les boutons réglables
// ======================================================================
// un paramètre = un poids = un morceau de connaissance
// - pas un nouveau type : un Node-feuille du graphe, gardé sous la main
// - state_dict : les paramètres par matrice nommée, le nom dit le rôle
// - liste plate params : l'optimiseur veut juste tous les boutons
// - bouger un bouton = feuille neuve, rien n'est muté

import { node, type Node } from "./03-autograd.ts";

/** un paramètre apprenable : un Node-feuille que l'optimiseur va tourner */
export type Parameter = Node;

/**
 * le dictionnaire d'état du modèle : nom de matrice → grille 2D de boutons
 * jamais muté, step en construit un nouveau
 */
export type StateDict = Readonly<Record<string, Parameter[][]>>;

/**
 * randomSeed : le même mulberry32 que le dataset, même graine donne même suite
 * dupliqué sciemment : cinq lignes, et chaque fichier du cours se lit seul
 */
export const randomSeed = (seed: number): (() => number) => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/**
 * gaussian : un tirage de la loi de Gauss, par Box-Muller
 *
 *   z = √(-2 · ln u₁) · cos(2π · u₂)     (distance aplanie × angle choisi)
 *
 * puis × std : petit σ, petite cloche
 * pourquoi : tout à zéro ou uniforme donne des neurones symétriques qui
 * apprennent la même chose, une petite cloche centrée casse la symétrie
 * (Karpathy : random.gauss, std = 0.08)
 */
export const gaussian = (rng: () => number, std = 0.08): number => {
  // 1 - rng() évite le bord 0 (ln(0) = -∞)
  const u1 = 1 - rng();
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2) * std;
};

/**
 * matrix : une matrice nout × nin de boutons tirés au sort (microgpt.py:80)
 * rng passé explicitement : une seule graine traverse l'initialisation, reproductible
 */
export const matrix = (rng: () => number, nout: number, nin: number, std = 0.08): Parameter[][] =>
  Array.from({ length: nout }, () => Array.from({ length: nin }, () => node(gaussian(rng, std))));

/**
 * flattenParams : du dict nommé à la liste plate, pour l'optimiseur (microgpt.py:89)
 * ordre stable (clés puis ligne puis colonne) : garde m[i]/v[i] d'Adam alignés sur params[i]
 */
export const flattenParams = (s: StateDict): readonly Parameter[] => {
  const out: Parameter[] = [];
  for (const key of Object.keys(s)) {
    for (const row of s[key]!) {
      for (const p of row) out.push(p);
    }
  }
  return out;
};

/**
 * step : un pas de descente de gradient toute simple (SGD)
 * chaque bouton : data ← data - lr · grad, le blâme lu là où backward l'a posé
 * renvoie un state_dict neuf, l'entraînement réel utilise Adam
 *
 *   backward(loss);                    // remplit les .grad
 *   const next = step(stateDict, 0.01);
 */
export const step = (s: StateDict, lr: number): StateDict => {
  const next: Record<string, Parameter[][]> = {};
  for (const key of Object.keys(s)) {
    next[key] = s[key]!.map((row) => row.map((p) => node(p.data - lr * p.grad)));
  }
  return next;
};

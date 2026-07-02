// ======================================================================
// 11 - Adam : l'optimiseur qui tourne les boutons
// ======================================================================
// backward donne le sens, Adam décide du combien
// deux idées par-dessus la SGD naïve :
// - momentum m, la bille lourde : moyenne lissée du gradient, ignore les zigzags
// - pas adaptatif v, l'agitation : moyenne des gradients au carré,
//   le pas est divisé par √agitation, chaque bouton a son propre dosage
// deux réglages en plus :
// - correction de biais : m et v partent de 0 et sous-estiment au début,
//   division par 1 - βˢ⁺¹ (forte au pas 0, aucune ensuite)
// - lr décroissant : lr_t = lr · (1 - pas/total), grands pas au début, fins à la fin
// adamStep renvoie un modèle neuf et un état neuf, zéro mutation
// (microgpt.py:147, « the blessed optimizer »)

import { node, type Node } from "./03-autograd.ts";
import type { StateDict } from "./04-parameters.ts";

/** hyperparamètres d'Adam + planning du learning rate (valeurs microgpt.py) */
export type AdamConfig = {
  readonly learningRate: number; // lr nominal (0.01)
  readonly beta1: number; // lissage de la bille lourde (0.85)
  readonly beta2: number; // lissage de l'agitation (0.99)
  readonly eps: number; // sécurité anti division par zéro (1e-8)
  readonly numSteps: number; // total de pas, pour la décroissance du lr
};

/** config Adam par défaut (Karpathy) pour numSteps pas */
export const makeAdamConfig = (
  numSteps: number,
  overrides: Partial<AdamConfig> = {},
): AdamConfig => ({
  learningRate: 0.01,
  beta1: 0.85,
  beta2: 0.99,
  eps: 1e-8,
  numSteps,
  ...overrides,
});

/**
 * l'état d'Adam : deux buffers alignés sur l'ordre de flattenParams
 * m[i] la bille lourde du i-ème bouton, v[i] son agitation, immuable
 */
export type AdamState = {
  readonly m: readonly number[];
  readonly v: readonly number[];
};

/** état initial : tous les moments à zéro, nParams = nombre de boutons */
export const initAdam = (nParams: number): AdamState => ({
  m: Array.from({ length: nParams }, () => 0),
  v: Array.from({ length: nParams }, () => 0),
});

/**
 * adamStep : un pas d'Adam sur tous les boutons
 *
 *   const { model: next, opt: nextOpt } = adamStep(model, opt, step, cfg);
 *
 * gradient lu sur chaque nœud (p.grad), là où backward vient de le poser
 * parcours dans l'ordre stable des clés (celui de flattenParams), compteur i sur m/v
 * pour chaque bouton :  data ← data - lr_t · m̂ / (√v̂ + eps)
 * step est 0-based, d'où le step + 1 de la correction de biais
 * modèle renvoyé en feuilles fraîches (grad remis à 0)
 */
export const adamStep = (
  model: StateDict,
  opt: AdamState,
  step: number,
  cfg: AdamConfig,
): { readonly model: StateDict; readonly opt: AdamState } => {
  const lrT = cfg.learningRate * (1 - step / cfg.numSteps);
  const m = [...opt.m];
  const v = [...opt.v];
  const biasCorr1 = 1 - cfg.beta1 ** (step + 1);
  const biasCorr2 = 1 - cfg.beta2 ** (step + 1);

  let i = 0;
  const next: Record<string, Node[][]> = {};
  for (const key of Object.keys(model)) {
    next[key] = model[key]!.map((row) =>
      row.map((p) => {
        const g = p.grad;
        m[i] = cfg.beta1 * m[i]! + (1 - cfg.beta1) * g;
        v[i] = cfg.beta2 * v[i]! + (1 - cfg.beta2) * g * g;
        const mHat = m[i]! / biasCorr1;
        const vHat = v[i]! / biasCorr2;
        const data = p.data - (lrT * mHat) / (Math.sqrt(vHat) + cfg.eps);
        i++;
        return node(data);
      }),
    );
  }

  return { model: next, opt: { m, v } };
};

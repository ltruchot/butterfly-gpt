// ======================================================================
// 10 - Loss : la « surprise » du modèle, en un seul chiffre
// ======================================================================
// l'entraînement veut un seul nombre d'erreur, qu'il fera baisser
// softmax → probabilités, p = celle de la bonne lettre, loss = -ln(p) :
//   sûr et juste (p ≈ 1)   → 0        coût nul
//   hésitant   (p ≈ 0,5)   → ~0,69    coût moyen
//   sûr et faux (p ≈ 0)    → +∞       le log châtie les erreurs faites avec aplomb
// repère : modèle non entraîné, p ≈ 1/vocabSize, loss ≈ ln(44) ≈ 3,8, puis ça descend
// (microgpt.py : -probs[target_id].log())

import { log, neg, type Node } from "./03-autograd.ts";
import { softmax } from "./07-attention.ts";

/**
 * crossEntropy : le coût d'une prédiction, -log(softmax(scores)[targetId])
 * un Node du graphe : backward remonte ce coût vers chaque bouton
 */
export const crossEntropy = (scores: readonly Node[], targetId: number): Node => {
  const probs = softmax(scores);
  const pTarget = probs[targetId];
  if (pTarget === undefined) {
    throw new Error(`crossEntropy: targetId ${targetId} hors des ${probs.length} scores`);
  }
  return neg(log(pTarget));
};

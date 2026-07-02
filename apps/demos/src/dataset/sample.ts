// ════════════════════════════════════════════════════════════════════════
// sample — sous-échantillon du corpus, RÉSERVÉ AUX DÉMOS
// ════════════════════════════════════════════════════════════════════════
// CECI N'EST PAS DANS microgpt.py. L'article entraîne sur tout le corpus
// (Karpathy : ~32 000 noms ; nous : ~6 916 noms de papillons, cf. `getAllDocs()`),
// et le runner `microgpt.ts` fait pareil. Le sous-échantillon ci-dessous est
// une PURE CONCESSION DE VITESSE pour les démos interactives : afficher et
// faire tourner un concept sur 500 entrées est instantané, sur 6 916 il faut
// quelques minutes. La logique est identique, seul le nombre d'exemples change.
//
// On garde ce helper HORS du package `microgpt-ts` (l'« essence », fidèle 1:1
// à l'article) pour ne pas y faire fuiter une commodité propre aux démos.
// ════════════════════════════════════════════════════════════════════════

import { getAllDocs, SEED, randomShuffle } from "microgpt-ts";

/** Nombre d'entrées retenues pour les démos (sous-échantillon de vitesse). */
export const DEMO_DOC_COUNT = 500;

/**
 * Les `DEMO_DOC_COUNT` premiers noms du corpus APRÈS le même mélange seedé
 * que le vrai entraînement (`randomShuffle(getAllDocs(), SEED)`). Reproductible :
 * même graine → mêmes 500 noms, dans le même ordre.
 */
export const demoDocs: readonly string[] = randomShuffle(getAllDocs(), SEED).slice(
  0,
  DEMO_DOC_COUNT,
);

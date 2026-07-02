import { getAllDocs, makeTokenizer } from "microgpt-ts";
import { demoDocs } from "../dataset/sample.ts";
import { makePubSub } from "../views/pubsub.ts";

// Vocabulaire complet (uchars + BOS) instancié au point d'usage, sur le corpus
// entier — comme le runner. Les phases de la démo n'illustrent que les 30
// premières entrées, mais la table d'ids finale montre le VRAI vocab.
const { uchars, BOS } = makeTokenizer(getAllDocs());

// ════════════════════════════════════════════════════════════════════════
// SESSION tokenizer — état mono-visiteur + broadcast SSE
// ════════════════════════════════════════════════════════════════════════
// Cinq phases, dans cet ordre :
//   initial    — 30 premières entrées de `demoDocs` (texte brut multiligne)
//   converted  — caractères de toutes ces entrées, en array (avec doublons)
//   deduped    — array sans doublons, ordre d'apparition préservé
//   sorted     — array trié
//   ids        — table char→id + BOS (le saut de ligne implicite)
//
// `/next` avance d'une phase, `/reset` revient à `initial`.

export type Phase = "initial" | "converted" | "deduped" | "sorted" | "ids";

const SAMPLE_SIZE = 30;
const SAMPLE_DOCS = demoDocs.slice(0, SAMPLE_SIZE);

// On précalcule les états dérivés une fois pour toutes (les fonctions sont
// pures et déterministes ; pas besoin de les recalculer à chaque clic).
const ALL_CHARS_FLAT: readonly string[] = SAMPLE_DOCS.flatMap((d) => Array.from(d));
const UNIQUE_CHARS: readonly string[] = (() => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const ch of ALL_CHARS_FLAT) {
    if (!seen.has(ch)) {
      seen.add(ch);
      out.push(ch);
    }
  }
  return out;
})();
// Même tri par tranches que le tronc (02-tokenizer.ts) : espace, puis a–z,
// puis tout le reste en ordre Unicode. Le tri JS est stable, donc le 2e
// passage conserve l'ordre alphabétique à l'intérieur de chaque tranche.
const rank = (c: string): number => (c === " " ? 0 : c >= "a" && c <= "z" ? 1 : 2);
const SORTED_CHARS: readonly string[] = [...UNIQUE_CHARS].sort().sort((a, b) => rank(a) - rank(b));

export type SessionSnapshot = {
  readonly phase: Phase;
  readonly entries: readonly string[]; // les 30 entrées de départ (sample)
  readonly flatChars: readonly string[]; // chars du sample avant dedup
  readonly uniqueChars: readonly string[]; // après dedup, avant sort (sample)
  readonly sortedChars: readonly string[]; // après sort (sample)
  readonly vocabChars: readonly string[]; // VOCAB COMPLET — uchars sur le corpus entier (~5 904 noms)
  readonly bos: number; // = uchars.length
};

type SessionState = { phase: Phase };
let state: SessionState = { phase: "initial" };

const snapshot = (): SessionSnapshot => ({
  phase: state.phase,
  entries: SAMPLE_DOCS,
  flatChars: ALL_CHARS_FLAT,
  uniqueChars: UNIQUE_CHARS,
  sortedChars: SORTED_CHARS,
  vocabChars: uchars,
  bos: BOS,
});

const PHASE_ORDER: readonly Phase[] = ["initial", "converted", "deduped", "sorted", "ids"];

export const advance = (): void => {
  const i = PHASE_ORDER.indexOf(state.phase);
  if (i >= 0 && i < PHASE_ORDER.length - 1) {
    state = { phase: PHASE_ORDER[i + 1]! };
  }
};

export const reset = (): void => {
  state = { phase: "initial" };
};

// Canal SSE de la démo — fabrique partagée (Set de subscribers isolé ici).
export const { subscribe, broadcast } = makePubSub();

export const getSnapshot = (): SessionSnapshot => snapshot();

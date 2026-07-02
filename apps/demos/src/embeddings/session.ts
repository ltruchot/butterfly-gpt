import {
  embed,
  getAllDocs,
  initModel,
  lookup,
  makeConfig,
  makeTokenizer,
  type Node,
  randomSeed,
} from "microgpt-ts";
import { makePubSub } from "../views/pubsub.ts";

const { vocabSize, encode } = makeTokenizer(getAllDocs());

// ════════════════════════════════════════════════════════════════════════
// SESSION embeddings — état mono-visiteur + broadcast SSE
// ════════════════════════════════════════════════════════════════════════
// On illustre la section 05 sur un vrai mot du corpus : « azur ». Pour chaque
// LETTRE (token), on déroule trois phases :
//   tokenRow — on va chercher la LIGNE de la table tokenEmb (lookup du token)
//   posRow   — on va chercher la LIGNE de la table positionEmb (lookup position)
//   summed   — on ADDITIONNE les deux vecteurs → x, l'entrée du modèle
// Puis `/next` passe à la lettre suivante (retour en phase tokenRow), jusqu'à
// la fin du mot. `/reset` revient à `initial`.
//
// nEmbd réduit à 6 (au lieu de 16) pour que les tables tiennent à l'écran ;
// la logique est rigoureusement identique. Tirages seedés → reproductible.

const WORD = "azur";
const N_EMBD_DEMO = 6;

const cfg = makeConfig(vocabSize, { nEmbd: N_EMBD_DEMO, blockSize: 8 });
const model = initModel(randomSeed(42), cfg);
const TOKENS = encode(WORD); // ids des lettres a, z, u, r

export type Phase = "initial" | "tokenRow" | "posRow" | "summed";

export type SessionSnapshot = {
  readonly phase: Phase;
  readonly pos: number; // index de la lettre courante (0..WORD.length-1)
  readonly word: string;
  readonly letters: readonly string[];
  readonly tokens: readonly number[];
  readonly nEmbd: number;
  // Vecteurs (en `data`) pour l'affichage, par lettre :
  readonly tokenRows: readonly (readonly number[])[]; // tokenEmb[token] de chaque lettre
  readonly posRows: readonly (readonly number[])[]; // positionEmb[pos] de chaque position
  readonly sums: readonly (readonly number[])[]; // tok + pos de chaque position
};

type SessionState = { phase: Phase; pos: number };

const empty = (): SessionState => ({ phase: "initial", pos: 0 });

let state: SessionState = empty();

const dataOf = (v: readonly Node[]): number[] => v.map((n) => n.data);

// Pré-calcul (pur, déterministe) des vecteurs affichés.
const TOKEN_ROWS = TOKENS.map((id) => dataOf(lookup(model.tokenEmb!, id)));
const POS_ROWS = TOKENS.map((_t, i) => dataOf(lookup(model.positionEmb!, i)));
const SUMS = TOKENS.map((id, i) => dataOf(embed(model.tokenEmb!, model.positionEmb!, id, i)));

const snapshot = (): SessionSnapshot => ({
  phase: state.phase,
  pos: state.pos,
  word: WORD,
  letters: Array.from(WORD),
  tokens: TOKENS,
  nEmbd: N_EMBD_DEMO,
  tokenRows: TOKEN_ROWS,
  posRows: POS_ROWS,
  sums: SUMS,
});

const PHASE_CYCLE: readonly Phase[] = ["tokenRow", "posRow", "summed"];

export const advance = (): void => {
  if (state.phase === "initial") {
    state = { phase: "tokenRow", pos: 0 };
    return;
  }
  const i = PHASE_CYCLE.indexOf(state.phase);
  if (i < PHASE_CYCLE.length - 1) {
    state = { ...state, phase: PHASE_CYCLE[i + 1]! };
    return;
  }
  // phase === "summed" : on passe à la lettre suivante s'il en reste.
  if (state.pos < TOKENS.length - 1) {
    state = { phase: "tokenRow", pos: state.pos + 1 };
  }
  // sinon : fin du mot, on reste sur le dernier "summed".
};

export const reset = (): void => {
  state = empty();
};

// Canal SSE de la démo — fabrique partagée (Set de subscribers isolé ici).
export const { subscribe, broadcast } = makePubSub();

export const getSnapshot = (): SessionSnapshot => snapshot();

import {
  addVec,
  attention,
  embed,
  getAllDocs,
  gpt,
  initModel,
  linear,
  makeConfig,
  makeTokenizer,
  mlp,
  randomSeed,
  type Node,
  rmsnorm,
} from "microgpt-ts";
import { makePubSub } from "../views/pubsub.ts";

const { uchars, vocabSize, encode } = makeTokenizer(getAllDocs());

// ════════════════════════════════════════════════════════════════════════
// SESSION forward — état mono-visiteur + broadcast SSE
// ════════════════════════════════════════════════════════════════════════
// La section « Architecture » assemblée : un passage avant complet pour UNE
// position. On suit le MÊME enchaînement que `gpt()` (09-model), et on montre
// le vecteur x après chaque étage :
//   embed   — x = tokenEmb[token] + positionEmb[pos], puis rmsnorm
//   attn    — bloc attention + connexion résiduelle (x + sortie)
//   mlp     — bloc MLP + connexion résiduelle
//   scores  — projection finale outputProj → un score par token du vocabulaire
// `/next` avance, `/reset` revient à `initial`. Déterministe.

const N_EMBD = 6;
const cfg = makeConfig(vocabSize, { nEmbd: N_EMBD, nHead: 2, blockSize: 8 });
const model = initModel(randomSeed(42), cfg);

const TOKEN = encode("azur")[0]!; // « a », à la position 0
const POS = 0;

const dataOf = (v: readonly Node[]): number[] => v.map((n) => n.data);

// On rejoue le corps de gpt() étage par étage pour capturer les intermédiaires.
const xEmbed = rmsnorm(embed(model.tokenEmb!, model.positionEmb!, TOKEN, POS));
const xn = rmsnorm(xEmbed);
const q = linear(xn, model.attn_wq!);
const k = linear(xn, model.attn_wk!);
const v = linear(xn, model.attn_wv!);
const attnOut = attention(q, [k], [v], cfg.nHead);
const xAttn = addVec(linear(attnOut, model.attn_wo!), xEmbed); // + résiduel
const xMlp = addVec(mlp(rmsnorm(xAttn), model.mlp_fc1!, model.mlp_fc2!), xAttn); // + résiduel
const SCORES = dataOf(linear(xMlp, model.outputProj!));

// Cohérence : ces scores sont EXACTEMENT ceux de gpt() (on s'aligne dessus).
const GPT_SCORES = dataOf(gpt(model, cfg, TOKEN, POS, { keys: [], values: [] }).scores);

const ARGMAX = SCORES.reduce((best, s, i) => (s > SCORES[best]! ? i : best), 0);

export type Phase = "initial" | "embed" | "attn" | "mlp" | "scores";

export type SessionSnapshot = {
  readonly phase: Phase;
  readonly nEmbd: number;
  readonly token: number;
  readonly tokenChar: string;
  readonly pos: number;
  readonly xEmbed: readonly number[];
  readonly xAttn: readonly number[];
  readonly xMlp: readonly number[];
  readonly scores: readonly number[];
  readonly argmax: number;
  readonly argmaxChar: string;
  readonly matchesGpt: boolean;
};

type SessionState = { phase: Phase };
const empty = (): SessionState => ({ phase: "initial" });

let state: SessionState = empty();

const snapshot = (): SessionSnapshot => ({
  phase: state.phase,
  nEmbd: N_EMBD,
  token: TOKEN,
  tokenChar: uchars[TOKEN] ?? "?",
  pos: POS,
  xEmbed: dataOf(xEmbed),
  xAttn: dataOf(xAttn),
  xMlp: dataOf(xMlp),
  scores: SCORES,
  argmax: ARGMAX,
  argmaxChar: uchars[ARGMAX] ?? "?",
  matchesGpt: SCORES.every((s, i) => Math.abs(s - GPT_SCORES[i]!) < 1e-9),
});

const ORDER: readonly Phase[] = ["initial", "embed", "attn", "mlp", "scores"];

export const advance = (): void => {
  const i = ORDER.indexOf(state.phase);
  if (i >= 0 && i < ORDER.length - 1) state = { phase: ORDER[i + 1]! };
};

export const reset = (): void => {
  state = empty();
};

// Canal SSE de la démo — fabrique partagée (Set de subscribers isolé ici).
export const { subscribe, broadcast } = makePubSub();

export const getSnapshot = (): SessionSnapshot => snapshot();

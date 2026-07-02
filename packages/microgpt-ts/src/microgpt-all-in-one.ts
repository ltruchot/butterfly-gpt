// ██████ ██  ██ ██████ ██████ ██████ █████  ██████ ██     ██  ██       ████  █████  ██████
// ██  ██ ██  ██   ██     ██   ██     ██  ██ ██     ██      ████       ██     ██  ██   ██
// █████  ██  ██   ██     ██   █████  █████  █████  ██       ██        ██ ███ █████    ██
// ██  ██ ██  ██   ██     ██   ██     ██  ██ ██     ██       ██        ██  ██ ██       ██
// ██████  ████    ██     ██   ██████ ██  ██ ██     ██████   ██         ████  ██       ██
//
// tout le GPT papillon dans un seul fichier, à lire d'une traite : l'équivalent du
// microgpt.py de Karpathy. Le cours détaillé vit dans les fichiers numérotés
// 01→13 (mêmes fonctions, mêmes noms) ; ici, juste l'essentiel en une ligne
// par brique. `node src/microgpt-all-in-one.ts 42` pour le lancer

import { dirname, join } from "node:path";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import * as nodeFs from "node:fs";

// --- Autograd : le graphe qui espionne les calculs et distribue le blâme ---

// Un arc : du résultat vers un opérande, avec son gradient local
export type Arc = {
  readonly target: Node;
  readonly localGradient: number;
};

// Un nombre qui se souvient d'où il vient (la `Value` de Karpathy)
export type Node = {
  readonly data: number;
  grad: number; // le blâme, rempli par backward. Seul champ mutable
  readonly children: ReadonlyArray<Arc>;
};

export type ComputationGraph = Node;

const arc = (target: Node, localGradient: number): Arc => ({ target, localGradient });

// Une feuille : une entrée, ou un bouton du modèle
export const node = (data: number): Node => ({ data, grad: 0, children: [] });

const op = (data: number, children: ReadonlyArray<Arc>): Node => ({ data, grad: 0, children });

// les six primitives : chacune connaît sa dérivée, backward compose
export const add = (a: Node, b: Node): Node => op(a.data + b.data, [arc(a, 1), arc(b, 1)]); // le routeur

export const mul = (a: Node, b: Node): Node =>
  op(a.data * b.data, [arc(a, b.data), arc(b, a.data)]); // l'échangeur

export const pow = (a: Node, n: number): Node => op(a.data ** n, [arc(a, n * a.data ** (n - 1))]);

export const log = (a: Node): Node => op(Math.log(a.data), [arc(a, 1 / a.data)]); // la surprise de la loss

export const exp = (a: Node): Node => {
  const e = Math.exp(a.data); // sa propre dérivée
  return op(e, [arc(a, e)]);
};

export const relu = (a: Node): Node => op(Math.max(0, a.data), [arc(a, a.data > 0 ? 1 : 0)]); // le coude

// Le reste se compose : la règle de la chaîne retrouve les dérivées seule
export const neg = (a: Node): Node => mul(a, node(-1));

export const sub = (a: Node, b: Node): Node => add(a, neg(b));

export const div = (a: Node, b: Node): Node => mul(a, pow(b, -1));

// Ordre topologique : chaque nœud après ceux dont il dépend
export const makeTopo = (root: Node): readonly Node[] => {
  const topo: Node[] = [];
  const visited = new Set<Node>();
  const visit = (current: Node): void => {
    if (visited.has(current)) return;
    visited.add(current);
    current.children.forEach(({ target }) => visit(target));
    topo.push(current);
  };
  visit(root);
  return topo;
};

// La passe arrière : l'étincelle (racine à 1), puis chaque nœud reverse le
// blâme à ses enfants (× le long d'un chemin, + entre les chemins)
export const backward = (root: Node): void => {
  const topo = makeTopo(root);

  root.grad = 1;
  for (let i = topo.length - 1; i >= 0; i--) {
    const current = topo[i]!;
    for (const { target, localGradient } of current.children) {
      target.grad += localGradient * current.grad;
    }
  }
};

export type BackwardStep = {
  readonly phase: "init" | "propagate" | "done";
  readonly currentNode: Node;
  readonly justUpdated: Node | null;
  readonly grads: ReadonlyMap<Node, number>;
};

// La même passe arrière, un yield par arc, pour les visualisations pas à pas
// uniquement (elle clone sa table à chaque arc : quadratique)
export function* backwardSteps(root: Node): Generator<BackwardStep> {
  const topo = makeTopo(root);

  const grads = new Map<Node, number>([[root, 1]]);
  yield { phase: "init", currentNode: root, justUpdated: null, grads: new Map(grads) };

  for (let i = topo.length - 1; i >= 0; i--) {
    const current = topo[i];
    const nodeGrad = grads.get(current) ?? 0;
    for (const { target, localGradient } of current.children) {
      grads.set(target, (grads.get(target) ?? 0) + localGradient * nodeGrad);
      yield {
        phase: "propagate",
        currentNode: current,
        justUpdated: target,
        grads: new Map(grads),
      };
    }
  }

  yield { phase: "done", currentNode: root, justUpdated: null, grads: new Map(grads) };
}

// --- Parameters : les boutons réglables ---

// Un paramètre = un Node-feuille qu'on prévoit de tourner
export type Parameter = Node;

// Les boutons rangés par matrice nommée (le nom dit le rôle)
export type StateDict = Readonly<Record<string, Parameter[][]>>;

// Tirage au hasard reproductible (mulberry32) : même graine, même suite
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

// Un tirage de la loi de Gauss par Box-Muller : distance aplanie × angle choisi
export const gaussian = (rng: () => number, std = 0.08): number => {
  const u1 = 1 - rng();
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2) * std;
};

// Une matrice nout × nin de boutons fraîchement tirés au sort
export const matrix = (rng: () => number, nout: number, nin: number, std = 0.08): Parameter[][] =>
  Array.from({ length: nout }, () => Array.from({ length: nin }, () => node(gaussian(rng, std))));

// Du dict nommé à la liste plate, dans un ordre stable (Adam y aligne m/v)
export const flattenParams = (s: StateDict): readonly Parameter[] => {
  const out: Parameter[] = [];
  for (const key of Object.keys(s)) {
    for (const row of s[key]!) {
      for (const p of row) out.push(p);
    }
  }
  return out;
};

// La SGD naïve : data ← data − lr · grad (l'entraînement réel utilise Adam)
export const step = (s: StateDict, lr: number): StateDict => {
  const next: Record<string, Parameter[][]> = {};
  for (const key of Object.keys(s)) {
    next[key] = s[key]!.map((row) => row.map((p) => node(p.data - lr * p.grad)));
  }
  return next;
};

// --- Dataset : le carburant, ~5 904 noms de papillons ---

export const SEED = 42; // « Let there be order among chaos » (Karpathy)

const PATH = new URL("../../../data/butterflies/french.refined.txt", import.meta.url);

export const loadRawDataset = (): string => nodeFs.readFileSync(PATH, "utf8");

// Des lignes propres : trim, et on jette les vides
export const cleanLines = (raw: string): readonly string[] =>
  raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

// Mélange Fisher-Yates seedé, sur une copie
export const randomShuffle = <T>(arr: readonly T[], seed: number): T[] => {
  const rng = randomSeed(seed);
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

export const getAllDocs = (): readonly string[] => cleanLines(loadRawDataset());

// --- Tokenizer : l'atomiseur, caractère ⇄ id, plus la frontière BOS ---

export type Tokenizer = {
  readonly uchars: readonly string[]; // caractères distincts triés : uchars[i] a l'id i
  readonly BOS: number; // la frontière des noms : [BOS, a, z, u, r, BOS]
  readonly vocabSize: number; // caractères + BOS
  readonly encode: (s: string) => number[];
  readonly decode: (ids: readonly number[]) => string;
};

// Tri en tranches (espace, a–z, le reste) pour garder « 1 = a, 26 = z »
const rank = (c: string): number => (c === " " ? 0 : c >= "a" && c <= "z" ? 1 : 2);

export const makeTokenizer = (docs: readonly string[]): Tokenizer => {
  const uchars: readonly string[] = Array.from(new Set(docs.join("")))
    .sort()
    .sort((a, b) => rank(a) - rank(b));

  const BOS = uchars.length;

  const encode = (s: string): number[] => Array.from(s, (ch) => uchars.indexOf(ch));

  const decode = (ids: readonly number[]): string =>
    ids
      .filter((id) => id >= 0 && id < uchars.length)
      .map((id) => uchars[id])
      .join("");

  return { uchars, BOS, vocabSize: uchars.length + 1, encode, decode };
};

// --- Architecture : embeddings, rmsnorm, attention, MLP, et gpt() qui câble ---

// La fiche-vecteur d'un indice : un simple accès table
export const lookup = (table: readonly Parameter[][], index: number): Node[] => {
  const row = table[index];
  if (row === undefined) {
    throw new Error(`lookup: indice ${index} hors de la table (taille ${table.length})`);
  }
  return [...row];
};

// Fiche du token + fiche de la position (sans elle, « a z u r » = « r u z a »)
export const embed = (
  tokenEmb: readonly Parameter[][],
  positionEmb: readonly Parameter[][],
  tokenId: number,
  posId: number,
): Node[] => {
  const tok = lookup(tokenEmb, tokenId);
  const pos = lookup(positionEmb, posId);

  return tok.map((t, i) => add(t, pos[i]!));
};

export const RMSNORM_EPS = 1e-5;

// Le volume du vecteur ramené vers ~1 (même direction, longueur régulée)
export const rmsnorm = (x: readonly Node[]): Node[] => {
  const n = x.length;
  if (n === 0) return [];

  let sumSquares: Node = node(0);
  for (const xi of x) sumSquares = add(sumSquares, pow(xi, 2));

  const meanSquare = mul(sumSquares, node(1 / n));
  const denom = pow(add(meanSquare, node(RMSNORM_EPS)), 0.5);
  const scale = div(node(1), denom);

  return x.map((xi) => mul(xi, scale));
};

// Le produit scalaire : l'affinité entre deux vecteurs, en un nombre
export const dot = (a: readonly Node[], b: readonly Node[]): Node => {
  let acc: Node = node(0);
  for (let i = 0; i < a.length; i++) acc = add(acc, mul(a[i]!, b[i]!));
  return acc;
};

// Un vecteur × une matrice de poids : LA brique de transformation
export const linear = (x: readonly Node[], w: readonly Parameter[][]): Node[] =>
  w.map((row) => dot(row, x));

// Des scores (les « logits » chez Karpathy) vers des probabilités : exp
// (recentré sur le max pour la stabilité) puis division par la somme
export const softmax = (scores: readonly Node[]): Node[] => {
  if (scores.length === 0) return [];

  const maxVal = Math.max(...scores.map((s) => s.data));
  const exps = scores.map((s) => exp(sub(s, node(maxVal))));

  let total: Node = node(0);
  for (const e of exps) total = add(total, e);
  return exps.map((e) => div(e, total));
};

// L'attention multi-tête : la query (je cherche quoi ?) face aux keys (je
// cherche où ?) → softmax → somme des values (je trouve quoi ?) pondérées
// chaque tête travaille sur ses tranches, on concatène à la fin
export const attention = (
  q: readonly Node[],
  keys: readonly (readonly Node[])[],
  values: readonly (readonly Node[])[],
  nHead: number,
): Node[] => {
  const nEmbd = q.length;
  const headDim = nEmbd / nHead;
  const invSqrt = 1 / Math.sqrt(headDim);
  const out: Node[] = [];

  for (let h = 0; h < nHead; h++) {
    const start = h * headDim;
    const end = start + headDim;

    const qH = q.slice(start, end);
    const kH = keys.map((k) => k.slice(start, end));
    const vH = values.map((v) => v.slice(start, end));

    const scores = kH.map((kt) => mul(dot(qH, kt), node(invSqrt)));
    const weights = softmax(scores);

    for (let j = 0; j < headDim; j++) {
      let acc: Node = node(0);
      for (let t = 0; t < vH.length; t++) acc = add(acc, mul(weights[t]!, vH[t]![j]!));
      out.push(acc);
    }
  }

  return out;
};

// Le MLP : dépliage (16 → 64) → coude (ReLU) → repliage (64 → 16)
export const mlp = (
  x: readonly Node[],
  fc1: readonly Parameter[][],
  fc2: readonly Parameter[][],
): Node[] => {
  const hidden = linear(x, fc1).map((h) => relu(h));
  return linear(hidden, fc2);
};

export type ModelConfig = {
  readonly vocabSize: number;
  readonly nEmbd: number;
  readonly blockSize: number;
  readonly nHead: number;
  readonly nLayer: number;
  readonly std: number;
};

// Défauts Karpathy, sauf blockSize = 64 (nos noms montent à 42 caractères)
export const makeConfig = (
  vocabSize: number,
  overrides: Partial<ModelConfig> = {},
): ModelConfig => ({
  vocabSize,
  nEmbd: 16,
  blockSize: 64,
  nHead: 4,
  nLayer: 1,
  std: 0.08,
  ...overrides,
});

export const headDim = (cfg: ModelConfig): number => cfg.nEmbd / cfg.nHead;

// Tous les boutons du modèle, tirés au sort (ordre des clés FIXE : il aligne
// flattenParams avec les buffers d'Adam)
export const initModel = (rng: () => number, cfg: ModelConfig): StateDict => {
  const { vocabSize, nEmbd, blockSize, std } = cfg;
  const mlpHidden = 4 * nEmbd;
  return {
    tokenEmb: matrix(rng, vocabSize, nEmbd, std),
    positionEmb: matrix(rng, blockSize, nEmbd, std),
    attn_wq: matrix(rng, nEmbd, nEmbd, std),
    attn_wk: matrix(rng, nEmbd, nEmbd, std),
    attn_wv: matrix(rng, nEmbd, nEmbd, std),
    attn_wo: matrix(rng, nEmbd, nEmbd, std),
    mlp_fc1: matrix(rng, mlpHidden, nEmbd, std),
    mlp_fc2: matrix(rng, nEmbd, mlpHidden, std),
    outputProj: matrix(rng, vocabSize, nEmbd, std),
  };
};

export type Cache = {
  readonly keys: readonly (readonly Node[])[];
  readonly values: readonly (readonly Node[])[];
};

export const emptyCache = (): Cache => ({ keys: [], values: [] });

// Le + du résiduel : deux vecteurs, terme à terme
const addVec = (a: readonly Node[], b: readonly Node[]): Node[] => a.map((ai, i) => add(ai, b[i]!));

// la passe avant complète pour une position : ① embeddings + rmsnorm,
// ② attention + résiduel, ③ MLP + résiduel, ④ projection vers les scores
// Le cache K/V (la mémoire, seul mécanisme qui connaît le passé) grandit
// d'un cran et repart avec le résultat
export const gpt = (
  model: StateDict,
  cfg: ModelConfig,
  tokenId: number,
  posId: number,
  cache: Cache,
): { readonly scores: Node[]; readonly cache: Cache } => {
  const wte = model.tokenEmb!;
  const wpe = model.positionEmb!;

  let x: Node[] = embed(wte, wpe, tokenId, posId);
  x = rmsnorm(x);

  const xResidual1 = x;
  const xn = rmsnorm(x);
  const q = linear(xn, model.attn_wq!);
  const k = linear(xn, model.attn_wk!);
  const v = linear(xn, model.attn_wv!);
  const keys = [...cache.keys, k];
  const values = [...cache.values, v];
  const xAttn = attention(q, keys, values, cfg.nHead);

  x = addVec(linear(xAttn, model.attn_wo!), xResidual1);

  const xResidual2 = x;
  x = addVec(mlp(rmsnorm(x), model.mlp_fc1!, model.mlp_fc2!), xResidual2);

  const scores = linear(x, model.outputProj!);

  return { scores, cache: { keys, values } };
};

// --- Training loop : la surprise, Adam, et les 5 gestes en boucle ---

// la loss d'une prédiction, la « surprise » : -ln(p de la bonne lettre)
export const crossEntropy = (scores: readonly Node[], targetId: number): Node => {
  const probs = softmax(scores);
  const pTarget = probs[targetId];
  if (pTarget === undefined) {
    throw new Error(`crossEntropy: targetId ${targetId} hors des ${probs.length} scores`);
  }
  return neg(log(pTarget));
};

export type AdamConfig = {
  readonly learningRate: number;
  readonly beta1: number;
  readonly beta2: number;
  readonly eps: number;
  readonly numSteps: number;
};

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

export type AdamState = {
  readonly m: readonly number[];
  readonly v: readonly number[];
};

export const initAdam = (nParams: number): AdamState => ({
  m: Array.from({ length: nParams }, () => 0),
  v: Array.from({ length: nParams }, () => 0),
});

// Un pas d'Adam : bille lourde (m) + agitation (v), correction de biais,
// lr décroissant. Chaque bouton a son propre dosage
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

// Un nom encadré de ses frontières : [BOS, a, z, u, r, BOS]
export const tokenize = (tok: Tokenizer, doc: string): number[] => [
  tok.BOS,
  ...tok.encode(doc),
  tok.BOS,
];

// La loss moyenne d'un nom : à chaque position, deviner la lettre suivante
export const forwardDoc = (model: StateDict, cfg: ModelConfig, tokens: readonly number[]): Node => {
  const n = Math.min(cfg.blockSize, tokens.length - 1);
  let cache: Cache = emptyCache();
  const losses: Node[] = [];

  for (let posId = 0; posId < n; posId++) {
    const tokenId = tokens[posId]!;
    const targetId = tokens[posId + 1]!;
    const out = gpt(model, cfg, tokenId, posId, cache);
    cache = out.cache;
    losses.push(crossEntropy(out.scores, targetId));
  }

  let sum: Node = losses[0]!;
  for (let i = 1; i < losses.length; i++) sum = add(sum, losses[i]!);
  return mul(node(1 / n), sum);
};

// Passe avant + loss + passe arrière (le blâme atterrit sur les .grad)
export const trainStep = (
  model: StateDict,
  cfg: ModelConfig,
  tokens: readonly number[],
): { readonly loss: number } => {
  const lossNode = forwardDoc(model, cfg, tokens);
  backward(lossNode);
  return { loss: lossNode.data };
};

export type TrainOptions = {
  readonly numSteps: number;
  readonly seed?: number;
  readonly onStep?: (step: number, loss: number) => void;
};

// 5 gestes, répétés numSteps fois : un nom, passe avant, loss, passe
// arrière, Adam. La loss part de ~3,8 (le hasard) et descend vers ~2,4
export const train = (
  docs: readonly string[],
  tok: Tokenizer,
  cfg: ModelConfig,
  adamCfg: AdamConfig,
  opts: TrainOptions,
): StateDict => {
  let model = initModel(randomSeed(opts.seed ?? 42), cfg);
  let opt: AdamState = initAdam(flattenParams(model).length);

  for (let step = 0; step < opts.numSteps; step++) {
    const doc = docs[step % docs.length]!;
    const tokens = tokenize(tok, doc);
    const { loss } = trainStep(model, cfg, tokens);
    const updated = adamStep(model, opt, step, adamCfg);
    model = updated.model;
    opt = updated.opt;
    opts.onStep?.(step, loss);
  }

  return model;
};

// --- Inference : le modèle rêve des noms qu'il n'a jamais vus ---

// La roue de la fortune : un indice tiré au sort selon des poids
export const choose = (weights: readonly number[], rng: () => number): number => {
  const total = weights.reduce((s, w) => s + w, 0);
  let r = rng() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i]!;
    if (r < 0) return i;
  }
  return weights.length - 1;
};

// Un nom, lettre par lettre : BOS → scores ÷ température (le bouton de
// créativité) → softmax → tirage au sort → on réinjecte, jusqu'à BOS
export const sample = (
  model: StateDict,
  cfg: ModelConfig,
  tok: Tokenizer,
  rng: () => number,
  temperature: number,
): string => {
  let cache: Cache = emptyCache();
  let tokenId = tok.BOS;
  const produced: number[] = [];

  for (let posId = 0; posId < cfg.blockSize; posId++) {
    const out = gpt(model, cfg, tokenId, posId, cache);
    cache = out.cache;

    const tempered: Node[] = out.scores.map((s) => div(s, node(temperature)));
    const probs = softmax(tempered).map((p) => p.data);

    tokenId = choose(probs, rng);
    if (tokenId === tok.BOS) break;
    produced.push(tokenId);
  }

  return tok.decode(produced);
};

// --- Run it : réglages, cache des poids par graine, entraînement, rêves ---

const num = (key: string, fallback: number): number => {
  const raw = process.env[key];
  if (raw === undefined || raw.trim() === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
};

const flags = new Map<string, string>();
const positionals: string[] = [];
for (const a of process.argv.slice(2)) {
  const m = /^(?:--)?([\w-]+)=(.*)$/.exec(a);
  if (m) flags.set(m[1]!.toLowerCase(), m[2]!);
  else positionals.push(a);
}

const flagNum = (names: readonly string[], envKey: string, fallback: number): number => {
  for (const n of names) {
    const raw = flags.get(n);
    if (raw !== undefined && raw.trim() !== "" && Number.isFinite(Number(raw))) return Number(raw);
  }
  return num(envKey, fallback);
};

const hard = Boolean(process.env.MICROGPT_HARD);
const numSteps = flagNum(["steps", "epochs"], "MICROGPT_STEPS", hard ? 10000 : 1000);
const numSamples = flagNum(["samples", "n"], "MICROGPT_SAMPLES", 20);
const temperature = flagNum(["temp", "temperature"], "MICROGPT_TEMPERATURE", 0.5);

const seedFlag = flags.get("seed");
const posSeed = positionals.find((p) => p.trim() !== "" && Number.isFinite(Number(p)));
const seed =
  seedFlag !== undefined && Number.isFinite(Number(seedFlag))
    ? Number(seedFlag)
    : posSeed !== undefined
      ? Number(posSeed)
      : num("MICROGPT_SEED", 43);

const corpus = randomShuffle(getAllDocs(), SEED);

const tok = makeTokenizer(getAllDocs());
const { uchars, vocabSize } = tok;

const cfg = makeConfig(vocabSize);
const adamCfg = makeAdamConfig(numSteps);

console.log("🦋  microgpt-ts · le GPT papillon");
console.log(
  `    corpus : ${corpus.length} noms · vocabulaire : ${vocabSize} tokens ` +
    `(${uchars.length} caractères + BOS)`,
);
console.log(
  `    modèle : nEmbd=${cfg.nEmbd} nHead=${cfg.nHead} nLayer=${cfg.nLayer} ` +
    `blockSize=${cfg.blockSize}`,
);
console.log(
  `    entraînement : ${numSteps} pas${hard ? " (mode hard)" : ""} · ` +
    `lr=${adamCfg.learningRate} · seed=${seed}\n`,
);

const cacheDir = hard ? "by_seeds_hard" : "by_seeds";
const BY_SEEDS = join(dirname(fileURLToPath(import.meta.url)), "..", cacheDir);

const cacheName = `${seed}-${numSteps}.json`;
const cachePath = join(BY_SEEDS, cacheName);

const cacheTag = {
  numSteps,
  vocabSize,
  nEmbd: cfg.nEmbd,
  nHead: cfg.nHead,
  blockSize: cfg.blockSize,
};

const toNumbers = (m: StateDict): Record<string, number[][]> => {
  const out: Record<string, number[][]> = {};
  for (const key of Object.keys(m)) out[key] = m[key]!.map((row) => row.map((p) => p.data));
  return out;
};

const fromNumbers = (mats: Record<string, number[][]>): StateDict => {
  const out: Record<string, Node[][]> = {};
  for (const key of Object.keys(mats)) out[key] = mats[key]!.map((row) => row.map((n) => node(n)));
  return out;
};

const trainFresh = (): StateDict => {
  const logEvery = Math.max(1, Math.floor(numSteps / 20));
  const tStart = Date.now();
  let ema = 0;
  const emaBeta = 0.95;
  const m = train(corpus, tok, cfg, adamCfg, {
    numSteps,
    seed,
    onStep: (step, loss) => {
      ema = step === 0 ? loss : emaBeta * ema + (1 - emaBeta) * loss;
      if (step % logEvery === 0 || step === numSteps - 1) {
        const pct = String(Math.round(((step + 1) / numSteps) * 100)).padStart(3);
        console.log(
          `  pas ${String(step + 1).padStart(5)} / ${numSteps}  (${pct}%)  ` +
            `loss ${loss.toFixed(4)}   moyenne lissée ${ema.toFixed(4)}`,
        );
      }
    },
  });
  console.log(`\n  ✔ entraînement terminé en ${((Date.now() - tStart) / 1000).toFixed(1)} s`);
  mkdirSync(BY_SEEDS, { recursive: true });
  writeFileSync(cachePath, JSON.stringify({ seed, ...cacheTag, matrices: toNumbers(m) }));
  console.log(`  💾 poids sauvegardés dans ${cacheDir}/${cacheName}\n`);
  return m;
};

const loadCached = (): StateDict | null => {
  if (!existsSync(cachePath)) return null;
  const json = JSON.parse(readFileSync(cachePath, "utf8")) as {
    numSteps: number;
    vocabSize: number;
    nEmbd: number;
    nHead: number;
    blockSize: number;
    matrices: Record<string, number[][]>;
  };
  const same =
    json.numSteps === cacheTag.numSteps &&
    json.vocabSize === cacheTag.vocabSize &&
    json.nEmbd === cacheTag.nEmbd &&
    json.nHead === cacheTag.nHead &&
    json.blockSize === cacheTag.blockSize;
  if (!same) {
    console.log(`  ⚠ ${cacheDir}/${cacheName} existe mais d'autres réglages → ré-entraînement\n`);
    return null;
  }
  return fromNumbers(json.matrices);
};

const cached = loadCached();
const model = cached ?? trainFresh();
if (cached) {
  console.log(`  ✔ poids chargés depuis ${cacheDir}/${cacheName}, aucun ré-entraînement\n`);
}

console.log("🎨  Noms de papillons hallucinés :\n");
const rng = randomSeed(seed + 1);
for (let i = 0; i < numSamples; i++) {
  const name = sample(model, cfg, tok, rng, temperature);
  console.log(`  ${String(i + 1).padStart(2)}.  ${name || "(vide)"}`);
}
console.log();

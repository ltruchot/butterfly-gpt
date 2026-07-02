// ██████ ██  ██ ██████ ██████ ██████ █████  ██████ ██     ██  ██       ████  █████  ██████
// ██  ██ ██  ██   ██     ██   ██     ██  ██ ██     ██      ████       ██     ██  ██   ██
// █████  ██  ██   ██     ██   █████  █████  █████  ██       ██        ██ ███ █████    ██
// ██  ██ ██  ██   ██     ██   ██     ██  ██ ██     ██       ██        ██  ██ ██       ██
// ██████  ████    ██     ██   ██████ ██  ██ ██     ██████   ██         ████  ██       ██
//
// the whole butterfly GPT in a single file, one straight read: the TS twin of
// Karpathy's microgpt.py. English edition of microgpt-all-in-one.ts (same code,
// comments translated, kept in sync by hand). The detailed course lives in the
// numbered files 01→13. `node src/microgpt-all-in-one.en.ts 42` to run it

import { dirname, join } from "node:path";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import * as nodeFs from "node:fs";

// --- Autograd: the graph that spies on every operation and hands out blame ---

// An arc: from a result to one of its operands, carrying the local gradient
export type Arc = {
  readonly target: Node;
  readonly localGradient: number;
};

// A number that remembers where it came from (Karpathy's `Value`)
export type Node = {
  readonly data: number;
  grad: number; // the blame, filled in by backward. Only mutable field
  readonly children: ReadonlyArray<Arc>;
};

export type ComputationGraph = Node;

const arc = (target: Node, localGradient: number): Arc => ({ target, localGradient });

// A leaf: an input, or one of the model's knobs
export const node = (data: number): Node => ({ data, grad: 0, children: [] });

const op = (data: number, children: ReadonlyArray<Arc>): Node => ({ data, grad: 0, children });

// the six primitives: each knows its own derivative, backward composes them
export const add = (a: Node, b: Node): Node => op(a.data + b.data, [arc(a, 1), arc(b, 1)]); // the router

export const mul = (a: Node, b: Node): Node =>
  op(a.data * b.data, [arc(a, b.data), arc(b, a.data)]); // the swapper

export const pow = (a: Node, n: number): Node => op(a.data ** n, [arc(a, n * a.data ** (n - 1))]);

export const log = (a: Node): Node => op(Math.log(a.data), [arc(a, 1 / a.data)]); // the loss's surprise

export const exp = (a: Node): Node => {
  const e = Math.exp(a.data); // its own derivative
  return op(e, [arc(a, e)]);
};

export const relu = (a: Node): Node => op(Math.max(0, a.data), [arc(a, a.data > 0 ? 1 : 0)]); // the elbow

// Everything else composes: the chain rule works out the derivatives on its own
export const neg = (a: Node): Node => mul(a, node(-1));

export const sub = (a: Node, b: Node): Node => add(a, neg(b));

export const div = (a: Node, b: Node): Node => mul(a, pow(b, -1));

// Topological order: every node comes after the ones it depends on
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

// The backward pass: the spark (root set to 1), then each node passes blame
// down to its children (× along a path, + across paths)
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

// The same backward pass, one yield per arc, for step-by-step visualizations
// only (it clones its table at every arc: quadratic)
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

// --- Parameters: the adjustable knobs ---

// A parameter = a leaf Node we intend to turn
export type Parameter = Node;

// The knobs stored by named matrix (the name tells the role)
export type StateDict = Readonly<Record<string, Parameter[][]>>;

// Reproducible randomness (mulberry32): same seed, same sequence
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

// One draw from the Gaussian bell via Box-Muller: flattened distance × chosen angle
export const gaussian = (rng: () => number, std = 0.08): number => {
  const u1 = 1 - rng();
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2) * std;
};

// A nout × nin matrix of freshly drawn knobs
export const matrix = (rng: () => number, nout: number, nin: number, std = 0.08): Parameter[][] =>
  Array.from({ length: nout }, () => Array.from({ length: nin }, () => node(gaussian(rng, std))));

// From the named dict to a flat list, in a stable order (Adam aligns m/v on it)
export const flattenParams = (s: StateDict): readonly Parameter[] => {
  const out: Parameter[] = [];
  for (const key of Object.keys(s)) {
    for (const row of s[key]!) {
      for (const p of row) out.push(p);
    }
  }
  return out;
};

// Plain SGD: data ← data − lr · grad (real training uses Adam)
export const step = (s: StateDict, lr: number): StateDict => {
  const next: Record<string, Parameter[][]> = {};
  for (const key of Object.keys(s)) {
    next[key] = s[key]!.map((row) => row.map((p) => node(p.data - lr * p.grad)));
  }
  return next;
};

// --- Dataset: the fuel, ~5,904 butterfly names ---

export const SEED = 42; // "Let there be order among chaos" (Karpathy)

const PATH = new URL("../../../data/butterflies/french.refined.txt", import.meta.url);

export const loadRawDataset = (): string => nodeFs.readFileSync(PATH, "utf8");

// Clean lines: trim, drop the empty ones
export const cleanLines = (raw: string): readonly string[] =>
  raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

// Seeded Fisher-Yates shuffle, on a copy
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

// --- Tokenizer: the atomizer, character ⇄ id, plus the BOS boundary ---

export type Tokenizer = {
  readonly uchars: readonly string[]; // distinct characters, sorted: uchars[i] has id i
  readonly BOS: number; // the name boundary: [BOS, a, z, u, r, BOS]
  readonly vocabSize: number; // characters + BOS
  readonly encode: (s: string) => number[];
  readonly decode: (ids: readonly number[]) => string;
};

// Sort in slices (space, a-z, the rest) to keep "1 = a, 26 = z"
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

// --- Architecture: embeddings, rmsnorm, attention, MLP, and gpt() wiring it all ---

// The vector ID card for an index: just a table access
export const lookup = (table: readonly Parameter[][], index: number): Node[] => {
  const row = table[index];
  if (row === undefined) {
    throw new Error(`lookup: index ${index} out of table (size ${table.length})`);
  }
  return [...row];
};

// Token card + position card (without it, "a z u r" = "r u z a")
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

// The vector's volume brought back to ~1 (same direction, regulated length)
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

// Dot product: how much two vectors agree, in a single number
export const dot = (a: readonly Node[], b: readonly Node[]): Node => {
  let acc: Node = node(0);
  for (let i = 0; i < a.length; i++) acc = add(acc, mul(a[i]!, b[i]!));
  return acc;
};

// A vector times a weight matrix: THE transformation brick
export const linear = (x: readonly Node[], w: readonly Parameter[][]): Node[] =>
  w.map((row) => dot(row, x));

// From raw scores (Karpathy calls them "logits") to probabilities: exp of each
// (re-centered on the max for stability) then divided by the sum
export const softmax = (scores: readonly Node[]): Node[] => {
  if (scores.length === 0) return [];

  const maxVal = Math.max(...scores.map((s) => s.data));
  const exps = scores.map((s) => exp(sub(s, node(maxVal))));

  let total: Node = node(0);
  for (const e of exps) total = add(total, e);
  return exps.map((e) => div(e, total));
};

// Multi-head attention: the query (what am I looking for?) against the keys
// (where do I look?), softmax, then a weighted sum of values (what do I find?)
// each head works on its own slices, everything is concatenated at the end
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

// The MLP: unfolding (16 → 64), elbow (ReLU), folding (64 → 16)
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

// Karpathy's defaults, except blockSize = 64 (our names run up to 42 characters)
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

// Every knob in the model, drawn at random (fixed key order: it keeps
// flattenParams aligned with Adam's buffers)
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

// The residual's +: two vectors, term by term
const addVec = (a: readonly Node[], b: readonly Node[]): Node[] => a.map((ai, i) => add(ai, b[i]!));

// the full forward pass for one position: ① embeddings + rmsnorm,
// ② attention + residual, ③ MLP + residual, ④ projection to the scores
// The K/V cache (the memory, the only mechanism that knows the past) grows
// by one notch and travels along with the result
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

// --- Training loop: the surprise, Adam, and the 5 moves on repeat ---

// the loss of one prediction, the "surprise": -ln(p of the right letter)
export const crossEntropy = (scores: readonly Node[], targetId: number): Node => {
  const probs = softmax(scores);
  const pTarget = probs[targetId];
  if (pTarget === undefined) {
    throw new Error(`crossEntropy: targetId ${targetId} out of the ${probs.length} scores`);
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

// One Adam step: heavy ball (m) + jitter (v), bias correction, decaying lr.
// Every knob gets its own dosage
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

// A name wrapped in its boundaries: [BOS, a, z, u, r, BOS]
export const tokenize = (tok: Tokenizer, doc: string): number[] => [
  tok.BOS,
  ...tok.encode(doc),
  tok.BOS,
];

// A name's average loss: at each position, guess the next letter
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

// Forward pass + loss + backward pass (the blame lands on the .grad fields)
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

// 5 moves, repeated numSteps times: a name, forward pass, loss, backward
// pass, Adam. The loss starts near ~3.8 (pure chance) and sinks toward ~2.4
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

// --- Inference: the model dreams up names it has never seen ---

// The wheel of fortune: an index drawn at random according to weights
export const choose = (weights: readonly number[], rng: () => number): number => {
  const total = weights.reduce((s, w) => s + w, 0);
  let r = rng() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i]!;
    if (r < 0) return i;
  }
  return weights.length - 1;
};

// One name, letter by letter: BOS, scores divided by temperature (the
// creativity knob), softmax, a random draw, feed the letter back, until BOS
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

// --- Run it: settings, per-seed weight cache, training, dreams ---

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

console.log("🦋  microgpt-ts · the butterfly GPT");
console.log(
  `    corpus: ${corpus.length} names · vocabulary: ${vocabSize} tokens ` +
    `(${uchars.length} characters + BOS)`,
);
console.log(
  `    model: nEmbd=${cfg.nEmbd} nHead=${cfg.nHead} nLayer=${cfg.nLayer} ` +
    `blockSize=${cfg.blockSize}`,
);
console.log(
  `    training: ${numSteps} steps${hard ? " (hard mode)" : ""} · ` +
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
          `  step ${String(step + 1).padStart(5)} / ${numSteps}  (${pct}%)  ` +
            `loss ${loss.toFixed(4)}   smoothed avg ${ema.toFixed(4)}`,
        );
      }
    },
  });
  console.log(`\n  ✔ training done in ${((Date.now() - tStart) / 1000).toFixed(1)} s`);
  mkdirSync(BY_SEEDS, { recursive: true });
  writeFileSync(cachePath, JSON.stringify({ seed, ...cacheTag, matrices: toNumbers(m) }));
  console.log(`  💾 weights saved to ${cacheDir}/${cacheName}\n`);
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
    console.log(`  ⚠ ${cacheDir}/${cacheName} exists but with other settings, retraining\n`);
    return null;
  }
  return fromNumbers(json.matrices);
};

const cached = loadCached();
const model = cached ?? trainFresh();
if (cached) {
  console.log(`  ✔ weights loaded from ${cacheDir}/${cacheName}, no retraining\n`);
}

console.log("🎨  Hallucinated butterfly names:\n");
const rng = randomSeed(seed + 1);
for (let i = 0; i < numSamples; i++) {
  const name = sample(model, cfg, tok, rng, temperature);
  console.log(`  ${String(i + 1).padStart(2)}.  ${name || "(empty)"}`);
}
console.log();

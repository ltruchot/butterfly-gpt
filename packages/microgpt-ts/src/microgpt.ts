// ======================================================================
// microgpt - le runner : l'équivalent de `python microgpt.py`, en une commande
// ======================================================================
// zéro mathématique ici, il orchestre les briques 01→13 avec le corpus papillon
//
//   vp run train                              (depuis la racine)
//   vp run infer 42                           (graine en positionnel)
//   vp run infer 42 --temp=0.7 --epochs=2000  (réglages en drapeaux CLI)
//   vp run infer:hard 42                      (10000 pas, cache by_seeds_hard/)
//   node src/microgpt.ts 42 --temp=0.7        (appel direct, env MICROGPT_* ok)
//
// De haut en bas :
// - corpus + vocabulaire, config modèle et Adam
// - entraînement, sauf poids déjà en cache pour cette (graine, durée) : rechargés
// - sampling : une vingtaine de noms rêvés
//
// Réglages : --epochs/--steps (1000), --samples (20), --temp (0.5), --seed
// ⚠ Sous `vp run`, passer par les drapeaux : vp nettoie l'environnement, les
//   MICROGPT_* n'arrivent pas (ils restent utiles en appel `node` direct)
//   Changer --temp ne ré-entraîne pas : poids en cache, on ré-échantillonne

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getAllDocs, SEED, randomShuffle } from "./01-dataset.ts";
import { makeTokenizer } from "./02-tokenizer.ts";
import { node, type Node } from "./03-autograd.ts";
import { randomSeed, type StateDict } from "./04-parameters.ts";
import { makeConfig } from "./09-model.ts";
import { makeAdamConfig } from "./11-adam.ts";
import { train } from "./12-train.ts";
import { sample } from "./13-sample.ts";

// --- Réglages : drapeaux CLI `--clé=valeur` > positionnel > env > défaut ---
// Les drapeaux traversent `vp run` (qui retire les env MICROGPT_*) et font
// partie de sa clé de cache : changer `--temp` invalide la sortie mise en
// cache → ré-échantillonnage. Les env restent le repli de l'appel `node` direct
const num = (key: string, fallback: number): number => {
  const raw = process.env[key];
  if (raw === undefined || raw.trim() === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
};

// argv scindé en drapeaux `--clé=valeur` (ou `clé=valeur`) et positionnels
const flags = new Map<string, string>();
const positionals: string[] = [];
for (const a of process.argv.slice(2)) {
  const m = /^(?:--)?([\w-]+)=(.*)$/.exec(a);
  if (m) flags.set(m[1]!.toLowerCase(), m[2]!);
  else positionals.push(a);
}
// Drapeau numérique (sous l'un des alias), sinon repli env, sinon défaut
const flagNum = (names: readonly string[], envKey: string, fallback: number): number => {
  for (const n of names) {
    const raw = flags.get(n);
    if (raw !== undefined && raw.trim() !== "" && Number.isFinite(Number(raw))) return Number(raw);
  }
  return num(envKey, fallback);
};

// Mode « hard » (vp run infer:hard) : entraînement long (10000 pas par défaut),
// cache séparé by_seeds_hard/ pour ne pas écraser les modèles rapides de by_seeds/
const hard = Boolean(process.env.MICROGPT_HARD);
const numSteps = flagNum(["steps", "epochs"], "MICROGPT_STEPS", hard ? 10000 : 1000);
const numSamples = flagNum(["samples", "n"], "MICROGPT_SAMPLES", 20);
const temperature = flagNum(["temp", "temperature"], "MICROGPT_TEMPERATURE", 0.5);
// Graine : `--seed=…` > 1er positionnel numérique (ex. `vp run infer 42`) > env > 43
const seedFlag = flags.get("seed");
const posSeed = positionals.find((p) => p.trim() !== "" && Number.isFinite(Number(p)));
const seed =
  seedFlag !== undefined && Number.isFinite(Number(seedFlag))
    ? Number(seedFlag)
    : posSeed !== undefined
      ? Number(posSeed)
      : num("MICROGPT_SEED", 43);
// on mélange : le fichier est trié alphabétiquement, avec numSteps < n
// `corpus[step % n]` ne verrait que des noms en « a », graine fixe comme microgpt.py
const corpus = randomShuffle(getAllDocs(), SEED);

// le vocabulaire se construit sur le corpus complet (l'ordre n'importe pas),
// `tok` est ensuite passé à l'entraînement et au sampling
const tok = makeTokenizer(getAllDocs());
const { uchars, vocabSize } = tok;

// --- config ---
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

// --- cache des poids par (graine, durée) : by_seeds[_hard]/<seed>-<steps>.json ---
// un JSON avec les seules matrices de nombres, après tous les pas : même graine
// et mêmes réglages au prochain lancement → rechargement, zéro ré-entraînement
// (changer la température ne touche que le sampling, donc recharge aussi)
const cacheDir = hard ? "by_seeds_hard" : "by_seeds";
const BY_SEEDS = join(dirname(fileURLToPath(import.meta.url)), "..", cacheDir);
const cacheName = `${seed}-${numSteps}.json`;
const cachePath = join(BY_SEEDS, cacheName);
// Réglages qui changent la forme ou le résultat : si l'un diffère, on ré-entraîne
const cacheTag = {
  numSteps,
  vocabSize,
  nEmbd: cfg.nEmbd,
  nHead: cfg.nHead,
  blockSize: cfg.blockSize,
};

// state_dict → matrices de nombres (on ne garde que les `.data`)
const toNumbers = (m: StateDict): Record<string, number[][]> => {
  const out: Record<string, number[][]> = {};
  for (const key of Object.keys(m)) out[key] = m[key]!.map((row) => row.map((p) => p.data));
  return out;
};
// matrices de nombres → state_dict (chaque nombre redevient une feuille `node`)
const fromNumbers = (mats: Record<string, number[][]>): StateDict => {
  const out: Record<string, Node[][]> = {};
  for (const key of Object.keys(mats)) out[key] = mats[key]!.map((row) => row.map((n) => node(n)));
  return out;
};

const trainFresh = (): StateDict => {
  // la loss part de ~ln(vocabSize) (le hasard) et descend, celle d'un nom est
  // bruitée, donc on affiche aussi une moyenne lissée (EMA) qui montre la tendance
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

// --- 4. Sampling : des noms de papillons tout neufs ---
console.log("🎨  Noms de papillons hallucinés :\n");
const rng = randomSeed(seed + 1);
for (let i = 0; i < numSamples; i++) {
  const name = sample(model, cfg, tok, rng, temperature);
  console.log(`  ${String(i + 1).padStart(2)}.  ${name || "(vide)"}`);
}
console.log();

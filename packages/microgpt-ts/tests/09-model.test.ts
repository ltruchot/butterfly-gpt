import { expect, test } from "vite-plus/test";
import { randomSeed } from "../src/04-parameters.ts";
import { emptyCache, gpt, headDim, initModel, makeConfig } from "../src/09-model.ts";

const cfg = makeConfig(5, { nEmbd: 4, nHead: 2, blockSize: 4 });

test("makeConfig: valeurs par défaut Karpathy + overrides", () => {
  const def = makeConfig(41);
  expect(def.nEmbd).toBe(16);
  expect(def.nHead).toBe(4);
  expect(def.nLayer).toBe(1);
  expect(def.blockSize).toBe(64); // adapté à nos noms longs (Karpathy : 16)
  expect(headDim(def)).toBe(4); // 16 / 4
});

test("initModel: toutes les matrices aux bonnes dimensions", () => {
  const m = initModel(randomSeed(1), cfg);
  expect(m.tokenEmb!.length).toBe(cfg.vocabSize); // 5 × 4
  expect(m.tokenEmb![0]!.length).toBe(cfg.nEmbd);
  expect(m.positionEmb!.length).toBe(cfg.blockSize); // 4 × 4
  expect(m.attn_wq!.length).toBe(cfg.nEmbd); // 4 × 4
  expect(m.mlp_fc1!.length).toBe(4 * cfg.nEmbd); // 16 × 4
  expect(m.mlp_fc2![0]!.length).toBe(4 * cfg.nEmbd); // 4 × 16
  expect(m.outputProj!.length).toBe(cfg.vocabSize); // 5 × 4
});

test("gpt: scores de longueur vocabSize, cache agrandi d'un cran", () => {
  const m = initModel(randomSeed(1), cfg);
  const { scores, cache } = gpt(m, cfg, 0, 0, emptyCache());
  expect(scores.length).toBe(cfg.vocabSize);
  expect(cache.keys.length).toBe(1);
  expect(cache.values.length).toBe(1);

  // Deuxième position : le cache passe à 2
  const next = gpt(m, cfg, 1, 1, cache);
  expect(next.cache.keys.length).toBe(2);
  expect(scores.every((s) => Number.isFinite(s.data))).toBe(true);
});

test("emptyCache: démarre vide", () => {
  expect(emptyCache().keys.length).toBe(0);
  expect(emptyCache().values.length).toBe(0);
});

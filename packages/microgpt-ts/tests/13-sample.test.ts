import { expect, test } from "vite-plus/test";
import { getAllDocs } from "../src/01-dataset.ts";
import { makeTokenizer } from "../src/02-tokenizer.ts";
import { randomSeed } from "../src/04-parameters.ts";
import { initModel, makeConfig } from "../src/09-model.ts";
import { choose, sample } from "../src/13-sample.ts";

const tok = makeTokenizer(getAllDocs());
const { vocabSize } = tok;

test("choose: tout le poids sur un indice → cet indice est toujours choisi", () => {
  const rng = randomSeed(1);
  for (let i = 0; i < 20; i++) expect(choose([0, 1, 0], rng)).toBe(1);
});

test("choose: respecte la position du tirage dans la roue des poids", () => {
  expect(choose([1, 1, 1], () => 0.0)).toBe(0); // tout début de la roue
  expect(choose([1, 1, 1], () => 0.99)).toBe(2); // toute fin de la roue
});

test("sample: renvoie une chaîne d'au plus blockSize caractères", () => {
  const cfg = makeConfig(vocabSize, { nEmbd: 8, blockSize: 8 });
  const model = initModel(randomSeed(1), cfg);
  const name = sample(model, cfg, tok, randomSeed(2), 0.5);
  expect(typeof name).toBe("string");
  expect(name.length).toBeLessThanOrEqual(cfg.blockSize);
});

test("sample: reproductible avec une même graine de tirage", () => {
  const cfg = makeConfig(vocabSize, { nEmbd: 8, blockSize: 8 });
  const model = initModel(randomSeed(1), cfg);
  const a = sample(model, cfg, tok, randomSeed(7), 0.5);
  const b = sample(model, cfg, tok, randomSeed(7), 0.5);
  expect(a).toBe(b);
});

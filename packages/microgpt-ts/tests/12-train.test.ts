import { expect, test } from "vite-plus/test";
import { getAllDocs } from "../src/01-dataset.ts";
import { makeTokenizer } from "../src/02-tokenizer.ts";
import { randomSeed } from "../src/04-parameters.ts";
import { initModel, makeConfig } from "../src/09-model.ts";
import { makeAdamConfig } from "../src/11-adam.ts";
import { forwardDoc, tokenize, train, trainStep } from "../src/12-train.ts";

const tok = makeTokenizer(getAllDocs());
const { BOS, encode, vocabSize } = tok;

test("tokenize: encadre le nom de BOS des deux côtés", () => {
  const t = tokenize(tok, "az");
  expect(t[0]).toBe(BOS);
  expect(t[t.length - 1]).toBe(BOS);
  expect(t).toEqual([BOS, ...encode("az"), BOS]);
});

test("forwardDoc: loss initiale finie, proche de ln(vocabSize)", () => {
  const cfg = makeConfig(vocabSize);
  const model = initModel(randomSeed(42), cfg);
  const loss = forwardDoc(model, cfg, tokenize(tok, "azur"));
  expect(Number.isFinite(loss.data)).toBe(true);
  expect(loss.data).toBeGreaterThan(2);
  expect(loss.data).toBeLessThan(5); // ln(44) ≈ 3,78
});

test("trainStep: renvoie une loss finie et dépose des gradients sur les paramètres", () => {
  const cfg = makeConfig(vocabSize, { nEmbd: 8, blockSize: 8 });
  const model = initModel(randomSeed(1), cfg);
  const { loss } = trainStep(model, cfg, tokenize(tok, "azur"));
  expect(Number.isFinite(loss)).toBe(true);
  // La projection de sortie est utilisée à CHAQUE position : toutes ses
  // cellules reçoivent un gradient non nul (contrairement aux lignes de
  // tokenEmb des tokens absents du document)
  expect(model.outputProj![0]![0]!.grad).not.toBe(0);
});

test("intégration : la boucle d'entraînement fait descendre la loss", () => {
  const numSteps = 80;
  const cfg = makeConfig(vocabSize, { nEmbd: 8, blockSize: 8 });
  const adamCfg = makeAdamConfig(numSteps, { learningRate: 0.05 });
  const losses: number[] = [];

  // On sur-apprend un mini-corpus : la loss doit nettement chuter
  train(["azur", "azuré", "argus"], tok, cfg, adamCfg, {
    numSteps,
    seed: 42,
    onStep: (_step, loss) => losses.push(loss),
  });

  const avg = (a: number[]) => a.reduce((s, x) => s + x, 0) / a.length;
  const debut = avg(losses.slice(0, 10));
  const fin = avg(losses.slice(-10));
  expect(fin).toBeLessThan(debut);
});

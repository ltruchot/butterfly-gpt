import { expect, test } from "vite-plus/test";
import { backward, node, pow, sub } from "../src/03-autograd.ts";
import type { StateDict } from "../src/04-parameters.ts";
import { adamStep, type AdamState, initAdam, makeAdamConfig } from "../src/11-adam.ts";

test("initAdam: buffers de moments à zéro", () => {
  const s = initAdam(3);
  expect(s.m).toEqual([0, 0, 0]);
  expect(s.v).toEqual([0, 0, 0]);
});

test("makeAdamConfig: valeurs par défaut Karpathy", () => {
  const c = makeAdamConfig(1000);
  expect(c.learningRate).toBeCloseTo(0.01, 10);
  expect(c.beta1).toBeCloseTo(0.85, 10);
  expect(c.beta2).toBeCloseTo(0.99, 10);
  expect(c.numSteps).toBe(1000);
});

test("adamStep: ne mute pas le modèle d'entrée", () => {
  const w = node(2);
  w.grad = 1;
  const model: StateDict = { w: [[w]] };
  adamStep(model, initAdam(1), 0, makeAdamConfig(10));
  expect(model.w![0]![0]).toBe(w); // référence intacte
  expect(w.data).toBe(2);
});

test("intégration : Adam fait converger w vers la cible sur loss = (w − 3)²", () => {
  const numSteps = 300;
  const cfg = makeAdamConfig(numSteps, { learningRate: 0.1 });
  let model: StateDict = { w: [[node(0)]] };
  let opt: AdamState = initAdam(1);

  let firstLoss = 0;
  let lastLoss = 0;
  for (let s = 0; s < numSteps; s++) {
    const w = model.w![0]![0]!;
    const loss = pow(sub(w, node(3)), 2); // (w − 3)²
    if (s === 0) firstLoss = loss.data;
    lastLoss = loss.data;
    backward(loss);
    const next = adamStep(model, opt, s, cfg);
    model = next.model;
    opt = next.opt;
  }

  expect(model.w![0]![0]!.data).toBeCloseTo(3, 1); // a convergé vers la cible
  expect(lastLoss).toBeLessThan(firstLoss); // la loss a bien descendu
});

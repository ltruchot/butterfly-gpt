import { expect, test } from "vite-plus/test";
import { add, backward, node, mul } from "../src/03-autograd.ts";
import {
  flattenParams,
  gaussian,
  matrix,
  randomSeed,
  type StateDict,
  step,
} from "../src/04-parameters.ts";

test("randomSeed: même graine → suite identique", () => {
  const a = randomSeed(42);
  const b = randomSeed(42);
  const seqA = [a(), a(), a(), a()];
  const seqB = [b(), b(), b(), b()];
  expect(seqA).toEqual(seqB);
});

test("randomSeed: valeurs dans [0, 1[", () => {
  const rng = randomSeed(7);
  for (let i = 0; i < 1000; i++) {
    const x = rng();
    expect(x).toBeGreaterThanOrEqual(0);
    expect(x).toBeLessThan(1);
  }
});

test("gaussian: moyenne ≈ 0 et écart-type ≈ std sur grand échantillon", () => {
  const rng = randomSeed(123);
  const std = 0.08;
  const N = 10000;
  const samples = Array.from({ length: N }, () => gaussian(rng, std));
  const mean = samples.reduce((s, x) => s + x, 0) / N;
  const variance = samples.reduce((s, x) => s + (x - mean) ** 2, 0) / N;
  expect(Math.abs(mean)).toBeLessThan(0.01);
  expect(Math.abs(Math.sqrt(variance) - std)).toBeLessThan(0.01);
});

test("matrix: dimensions nout × nin", () => {
  const rng = randomSeed(1);
  const m = matrix(rng, 3, 4);
  expect(m.length).toBe(3);
  for (const row of m) expect(row.length).toBe(4);
});

test("matrix: cellules = Nodes-feuilles (children vide)", () => {
  const rng = randomSeed(1);
  const m = matrix(rng, 2, 2);
  for (const row of m) {
    for (const p of row) {
      expect(p.children).toEqual([]);
      expect(typeof p.data).toBe("number");
    }
  }
});

test("flattenParams: ordre clés → ligne → colonne, longueur cumulée", () => {
  const rng = randomSeed(1);
  const sd: StateDict = {
    a: matrix(rng, 2, 3), //  6
    b: matrix(rng, 1, 4), //  4
  };
  const flat = flattenParams(sd);
  expect(flat.length).toBe(6 + 4);
  // Premier élément = sd.a[0][0], dernier = sd.b[0][3]
  expect(flat[0]).toBe(sd.a![0]![0]);
  expect(flat[flat.length - 1]).toBe(sd.b![0]![3]);
});

test("step: nouvelle StateDict avec data ← data - lr · grad, paramètres sans grad inchangés", () => {
  // Construit un mini-graphe : loss = (w · x) où w ∈ params, x est juste une feuille `node`
  const w = node(2.0);
  const x = node(3.0);
  const loss = mul(w, x);
  backward(loss); // ∂loss/∂w = x.data = 3, déposé sur w.grad
  expect(w.grad).toBe(3);

  const sd: StateDict = { layer: [[w]] };
  const next = step(sd, 0.1);

  // w.data était 2.0, nouveau = 2.0 - 0.1 * 3 = 1.7
  expect(next.layer![0]![0]!.data).toBeCloseTo(1.7, 10);
  // L'ancien w est intact (immutabilité de data)
  expect(w.data).toBe(2.0);
});

test("step: paramètre jamais touché par backward (grad 0) → laissé inchangé", () => {
  const p = node(5.0); // grad reste 0 → data - lr · 0 = data
  const sd: StateDict = { a: [[p]] };
  const next = step(sd, 0.1);
  expect(next.a![0]![0]!.data).toBe(5.0);
});

test("step: ne mute pas l'ancien state_dict", () => {
  const p = node(1.0);
  p.grad = 1.0;
  const sd: StateDict = { a: [[p]] };
  step(sd, 0.5);
  expect(sd.a![0]![0]).toBe(p);
  expect(p.data).toBe(1.0);
});

test("intégration : 1 step de SGD sur loss = (w - target)², gradient = 2·(w - target)", () => {
  // w part à 1.0, cible 5.0, loss = (1-5)² = 16, grad = 2·(1-5) = -8
  // avec lr=0.1, nouveau w = 1 - 0.1·(-8) = 1.8 (donc bouge vers 5, ok)
  const w = node(1.0);
  const target = node(5.0);
  const diff = add(w, mul(target, node(-1))); // w - target
  const loss = mul(diff, diff); // diff²
  backward(loss);
  const sd: StateDict = { w: [[w]] };
  const next = step(sd, 0.1);
  const newW = next.w![0]![0]!.data;
  expect(newW).toBeGreaterThan(1.0);
  expect(newW).toBeLessThan(5.0);
});

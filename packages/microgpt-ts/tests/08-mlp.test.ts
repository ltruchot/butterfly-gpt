import { expect, test } from "vite-plus/test";
import { backward, node } from "../src/03-autograd.ts";
import { mlp } from "../src/08-mlp.ts";

test("mlp: la sortie a la même longueur que l'entrée (nEmbd)", () => {
  // nEmbd = 2, hidden = 4. fc1 : 4×2, fc2 : 2×4
  const x = [node(1), node(-1)];
  const fc1 = [
    [node(1), node(0)],
    [node(0), node(1)],
    [node(1), node(1)],
    [node(-1), node(2)],
  ];
  const fc2 = [
    [node(0.5), node(0.5), node(0.5), node(0.5)],
    [node(1), node(0), node(1), node(0)],
  ];
  const out = mlp(x, fc1, fc2);
  expect(out.length).toBe(2);
});

test("mlp: ReLU coupe les négatifs (un poids fc2 nul reste dérivable)", () => {
  // Vérifie surtout que tout le bloc est dérivable de bout en bout
  const x = [node(2), node(3)];
  const fc1 = [
    [node(1), node(1)],
    [node(-1), node(-1)],
  ];
  const fc2 = [[node(1), node(1)]];
  const out = mlp(x, fc1, fc2);
  expect(out.length).toBe(1);
  // hidden = relu([5, -5]) = [5, 0] ; sortie = 1·5 + 1·0 = 5
  expect(out[0]!.data).toBeCloseTo(5, 10);
  // backward ne lève pas et produit un gradient fini pour x[0]
  backward(out[0]!);
  expect(Number.isFinite(x[0]!.grad)).toBe(true);
});

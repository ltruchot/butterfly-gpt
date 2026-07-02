import { expect, test } from "vite-plus/test";
import { node } from "../src/03-autograd.ts";
import { crossEntropy } from "../src/10-loss.ts";

test("crossEntropy: scores uniformes → loss ≈ ln(nombre de classes)", () => {
  const scores = [node(0), node(0), node(0), node(0)]; // 4 classes équiprobables
  const loss = crossEntropy(scores, 0);
  expect(loss.data).toBeCloseTo(Math.log(4), 6); // proba bonne réponse = 1/4
});

test("crossEntropy: bonne réponse quasi certaine → loss ≈ 0", () => {
  const scores = [node(100), node(0), node(0)]; // proba[0] ≈ 1
  const loss = crossEntropy(scores, 0);
  expect(loss.data).toBeLessThan(1e-3);
  expect(loss.data).toBeGreaterThanOrEqual(0);
});

test("crossEntropy: erreur commise avec assurance → loss élevée", () => {
  const scores = [node(100), node(0), node(0)]; // le modèle parie tout sur 0…
  const loss = crossEntropy(scores, 1); // …mais la vérité est 1.
  expect(loss.data).toBeGreaterThan(50);
});

test("crossEntropy: target hors plage → erreur", () => {
  expect(() => crossEntropy([node(1), node(2)], 9)).toThrow();
});

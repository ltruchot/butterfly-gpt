import { expect, test } from "vite-plus/test";
import { node } from "../src/03-autograd.ts";
import { rmsnorm } from "../src/06-rmsnorm.ts";

test("rmsnorm: vecteur vide → vide", () => {
  expect(rmsnorm([])).toEqual([]);
});

test("rmsnorm: conserve la longueur", () => {
  const out = rmsnorm([node(1), node(2), node(3)]);
  expect(out.length).toBe(3);
});

test("rmsnorm: la moyenne des carrés de sortie vaut ≈ 1 (échelle régulée)", () => {
  const out = rmsnorm([node(3), node(4)]).map((n) => n.data);
  const ms = out.reduce((s, x) => s + x * x, 0) / out.length;
  expect(ms).toBeCloseTo(1, 4); // ms/(ms+ε) ≈ 1
});

test("rmsnorm: préserve la direction (ratios entre composantes)", () => {
  const out = rmsnorm([node(3), node(6)]).map((n) => n.data);
  // 3:6 = 1:2 doit être conservé après mise à l'échelle
  expect(out[1]! / out[0]!).toBeCloseTo(2, 10);
});

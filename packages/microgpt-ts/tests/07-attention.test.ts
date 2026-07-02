import { expect, test } from "vite-plus/test";
import { node } from "../src/03-autograd.ts";
import { attention, dot, linear, softmax } from "../src/07-attention.ts";

test("dot: produit scalaire = somme des produits", () => {
  const d = dot([node(1), node(2), node(3)], [node(4), node(5), node(6)]);
  expect(d.data).toBeCloseTo(1 * 4 + 2 * 5 + 3 * 6, 10); // 32
});

test("linear: chaque ligne de w fait un produit scalaire avec x", () => {
  const x = [node(2), node(3)];
  const w = [
    [node(1), node(0)], // → 2
    [node(0), node(1)], // → 3
    [node(1), node(1)], // → 5
  ];
  expect(linear(x, w).map((n) => n.data)).toEqual([2, 3, 5]);
});

test("softmax: somme à 1 et préserve l'ordre", () => {
  const p = softmax([node(1), node(3), node(2)]).map((n) => n.data);
  expect(p.reduce((s, x) => s + x, 0)).toBeCloseTo(1, 10);
  expect(p[1]).toBeGreaterThan(p[2]!); // score 3 > score 2
  expect(p[2]).toBeGreaterThan(p[0]!); // score 2 > score 1
});

test("softmax: stable même avec de très grands scores", () => {
  const p = softmax([node(1000), node(1001)]).map((n) => n.data);
  expect(p.every((x) => Number.isFinite(x))).toBe(true);
  expect(p[0]! + p[1]!).toBeCloseTo(1, 10);
});

test("attention: une seule position, une tête → la sortie est la valeur", () => {
  // T=1 → poids softmax = 1 → head_out = v. nEmbd=2, nHead=1
  const q = [node(0.5), node(-0.5)];
  const k = [node(1), node(2)];
  const v = [node(7), node(9)];
  const out = attention(q, [k], [v], 1).map((n) => n.data);
  expect(out[0]).toBeCloseTo(7, 10);
  expect(out[1]).toBeCloseTo(9, 10);
});

test("attention: multi-tête conserve la longueur nEmbd", () => {
  const q = [node(0.1), node(0.2), node(0.3), node(0.4)];
  const k = [node(1), node(0), node(1), node(0)];
  const v = [node(1), node(2), node(3), node(4)];
  const out = attention(q, [k], [v], 2); // nEmbd=4, nHead=2
  expect(out.length).toBe(4);
});

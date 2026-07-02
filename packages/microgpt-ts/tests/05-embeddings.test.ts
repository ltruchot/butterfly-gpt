import { expect, test } from "vite-plus/test";
import { node } from "../src/03-autograd.ts";
import { embed, lookup } from "../src/05-embeddings.ts";

test("lookup: renvoie la ligne demandée (copie)", () => {
  const table = [
    [node(1), node(2)],
    [node(3), node(4)],
  ];
  const row = lookup(table, 1);
  expect(row.map((n) => n.data)).toEqual([3, 4]);
});

test("lookup: indice hors table → erreur", () => {
  expect(() => lookup([[node(1)]], 5)).toThrow();
});

test("embed: addition terme à terme token + position", () => {
  const tokenEmb = [
    [node(1), node(2)],
    [node(10), node(20)],
  ];
  const positionEmb = [
    [node(0.5), node(0.5)],
    [node(100), node(200)],
  ];
  const x = embed(tokenEmb, positionEmb, 1, 0); // token 1 + position 0
  expect(x.length).toBe(2);
  expect(x[0]!.data).toBeCloseTo(10.5, 10);
  expect(x[1]!.data).toBeCloseTo(20.5, 10);
});

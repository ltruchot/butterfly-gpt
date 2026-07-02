import { expect, test } from "vite-plus/test";
import {
  BINS,
  CAP,
  degOf,
  draw,
  fmt,
  FRAME,
  histogram,
  makeRng,
  type Shot,
} from "./tirage-gaussien.logic.ts";

test("makeRng : déterministe par graine (même graine → même séquence)", () => {
  const a = makeRng(7);
  const b = makeRng(7);
  const seqA = [a(), a(), a()];
  const seqB = [b(), b(), b()];
  expect(seqA).toEqual(seqB);
  // valeurs dans [0, 1[
  for (const v of seqA) {
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThan(1);
  }
});

test("draw : produit un tir Box-Muller cohérent (zx = r·cos a, zy = r·sin a)", () => {
  const rng = makeRng(7);
  const d = draw(rng);
  expect(Number.isFinite(d.r)).toBe(true);
  expect(d.r).toBeGreaterThanOrEqual(0); // rayon = √(−2·ln u1) ≥ 0
  expect(d.zx).toBeCloseTo(d.r * Math.cos(d.a), 10);
  expect(d.zy).toBeCloseTo(d.r * Math.sin(d.a), 10);
});

test("histogram : BINS barres, somme des comptes = impacts DANS le cadre", () => {
  const rng = makeRng(7);
  const samples: Shot[] = Array.from({ length: 500 }, () => draw(rng));
  const sigma = 0.08;
  const bars = histogram(samples, sigma);
  expect(bars).toHaveLength(BINS);
  // contrat exact : on compte les impacts dont l'ombre tombe dans [−FRAME, FRAME[
  // (les rares au-delà de ~3,75σ sont exclus, comme dans la slide d'origine).
  const inFrame = samples.filter((d) => Math.abs(d.zx * sigma) < FRAME).length;
  const total = bars.reduce((s, b) => s + b.c, 0);
  expect(total).toBe(inFrame);
  expect(total).toBeLessThanOrEqual(samples.length);
  // hauteur normalisée : la plus haute barre culmine à 46 (l'échelle du SVG)
  expect(Math.max(...bars.map((b) => b.h))).toBeCloseTo(46, 10);
});

test("fmt : format en-US fixe (point décimal), degOf : angle en degrés entiers", () => {
  expect(fmt(0.123456)).toBe("0.12");
  expect(fmt(0.123456, 3)).toBe("0.123");
  expect(degOf(Math.PI)).toBe("180");
});

test("CAP : la limite dure vaut 10000", () => {
  expect(CAP).toBe(10000);
});

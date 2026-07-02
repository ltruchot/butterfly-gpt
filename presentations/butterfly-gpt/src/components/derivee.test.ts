import { expect, test } from "vite-plus/test";
import {
  curvePath,
  fmt,
  h,
  hPrime,
  phaseColorOf,
  phaseOf,
  T_MAX,
  T_MIN,
  tangentOf,
  tFromViewBoxX,
  tToX,
  slopeStr,
  phaseTextOf,
} from "./derivee.logic.ts";

test("slopeStr/phaseTextOf : δ + libellé (tolèrent un t en chaîne)", () => {
  // début du vol (t=2) → pente forte ; fin (t=9, après le palier TV=8) → 0
  expect(slopeStr(9)).toBe("0");
  expect(slopeStr("9")).toBe("0"); // valeur d'un <input range> en string
  expect(Number(slopeStr(2))).toBeGreaterThan(0);
  expect(phaseTextOf(9)).toMatch(/stabilise|≈ 0/);
});

test("h : monte puis se stabilise sur un palier plat", () => {
  // strictement croissante avant le palier (TV = 8)
  expect(h(2)).toBeLessThan(h(5));
  expect(h(5)).toBeLessThan(h(7.9));
  // plat après TV : même altitude
  expect(h(8)).toBeCloseTo(h(10), 10);
});

test("hPrime : pente ≥ 0, décroît, et nulle après le palier", () => {
  expect(hPrime(0)).toBeGreaterThan(hPrime(4)); // la pente faiblit
  expect(hPrime(4)).toBeGreaterThan(hPrime(7));
  expect(hPrime(8)).toBe(0); // palier : plus de montée
  expect(hPrime(10)).toBe(0);
  expect(hPrime(2)).toBeGreaterThan(0);
});

test("curvePath : déterministe et bien formé (M … L …)", () => {
  const a = curvePath();
  const b = curvePath();
  expect(a).toBe(b); // pur → même sortie
  expect(a.startsWith("M")).toBe(true);
  expect(a.split("L").length).toBe(121); // 1 M + 120 L
});

test("tangentOf : centrée sur le papillon, pente pixel cohérente", () => {
  const seg = tangentOf(2);
  // segment symétrique horizontalement autour de px = tToX(2)
  expect((seg.x1 + seg.x2) / 2).toBeCloseTo(tToX(2), 6);
  // pente montante en MONDE → en pixels y descend (axe y inversé) : y2 < y1
  expect(seg.y2).toBeLessThan(seg.y1);
  // au palier, pente nulle → trait horizontal
  const flat = tangentOf(9);
  expect(flat.y1).toBeCloseTo(flat.y2, 6);
});

test("phaseOf / phaseColorOf : seuils de lecture", () => {
  expect(phaseOf(0.05)).toMatch(/stabilise/);
  expect(phaseColorOf(0.05)).toBe("var(--amber)");
  expect(phaseOf(2)).toMatch(/vite/);
  expect(phaseOf(0.5)).toMatch(/ralentit/);
  expect(phaseColorOf(0.5)).toBe("var(--teal)");
});

test("tFromViewBoxX : convertit et borne dans [T_MIN, T_MAX]", () => {
  // au-delà du cadre → clampé aux bornes
  expect(tFromViewBoxX(-9999)).toBe(T_MIN);
  expect(tFromViewBoxX(9999)).toBe(T_MAX);
  // aller-retour : x = tToX(t) ⇒ tFromViewBoxX(x) ≈ t
  expect(tFromViewBoxX(tToX(6))).toBeCloseTo(6, 6);
});

test("fmt : entier en format français", () => {
  expect(fmt(2.6)).toBe("3");
  expect(fmt(0)).toBe("0");
});

test("i18n EN : libellés de phase anglais (lang explicite)", () => {
  expect(phaseOf(0.05, "en")).toMatch(/stabili/);
  expect(phaseOf(2, "en")).toBe("▲ rising fast");
  expect(phaseOf(0.5, "en")).toBe("▲ rising, but slowing");
  // la couleur (indépendante de la langue) reste cohérente
  expect(phaseColorOf(0.05)).toBe("var(--amber)");
});

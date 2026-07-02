import { expect, test } from "vite-plus/test";
import { factorOf, nPiedOf, totalOf, tripsOf } from "./chaine-ramifiee.logic.ts";

test("factorOf : pied ×1, vélo ×bike, voiture ×bike×car (la chaîne = un produit)", () => {
  expect(factorOf("pied", 4, 2)).toBe(1);
  expect(factorOf("velo", 4, 2)).toBe(4); // ×bike
  expect(factorOf("voiture", 4, 2)).toBe(8); // ×bike×car = 4×2 — cumule la chaîne
});

test("factorOf : la voiture enchaîne vélo PUIS voiture (×bike×car)", () => {
  // invariant pédagogique : voiture = velo × car, jamais une vitesse « à part »
  expect(factorOf("voiture", 3, 3)).toBe(factorOf("velo", 3, 3) * 3);
});

test("nPiedOf : le reste de la semaine (6 jours) se fait à pied", () => {
  expect(nPiedOf(2, 2)).toBe(2); // 6 − 2 − 2
  expect(nPiedOf(0, 0)).toBe(6); // tout à pied
  expect(nPiedOf(3, 3)).toBe(0); // plein de véhicules → plus rien à pied
});

test("tripsOf : 6 trajets, ordonnés pied → vélo → voiture, avec leur hauteur", () => {
  const trips = tripsOf(nPiedOf(2, 2), 2, 2, 4, 2);
  expect(trips).toHaveLength(6);
  expect(trips.map((t) => t.mode)).toEqual(["pied", "pied", "velo", "velo", "voiture", "voiture"]);
  // chaque trajet reçoit un créneau vertical distinct
  expect(new Set(trips.map((t) => t.ay)).size).toBe(6);
});

test("totalOf : la pente est le CUMUL des dérivées, pas la moyenne", () => {
  // plancher : tout à pied → 6 trajets ×1 = 6
  const piedSeul = tripsOf(6, 0, 0, 4, 2);
  expect(totalOf(piedSeul)).toBe(6);

  // 2 pied (×1) + 2 vélo (×4) + 2 voiture (×8) = 2 + 8 + 16 = 26 (on ADDITIONNE)
  const mixte = tripsOf(2, 2, 2, 4, 2);
  expect(totalOf(mixte)).toBe(26);
});

test("totalOf : +1 km/h de base ⇒ +total km/h sur la semaine (la pente)", () => {
  // la pente EST le coefficient qui relie +1 de base au gain hebdo
  const trips = tripsOf(1, 2, 3, 3, 2); // 1×1 + 2×3 + 3×6 = 1 + 6 + 18 = 25
  expect(totalOf(trips)).toBe(25);
});

import { expect, test } from "vite-plus/test";
import {
  aireOf,
  baseY,
  fmt,
  H_MAX,
  L_MAX,
  partialLabel,
  PAD_L,
  PAD_R,
  PAD_T,
  PAD_B,
  rectHOf,
  rectWOf,
  rectYOf,
  SX,
  SY,
  VIEW_H,
  VIEW_W,
} from "./derivee-partielle.logic.ts";

test("échelle : SX et SY calent les bornes max sur la zone utile du SVG", () => {
  // largeur max → toute la largeur disponible ; hauteur max → toute la hauteur
  expect(L_MAX * SX).toBeCloseTo(VIEW_W - PAD_L - PAD_R, 6);
  expect(H_MAX * SY).toBeCloseTo(VIEW_H - PAD_T - PAD_B, 6);
});

test("rectWOf / rectHOf : pixels proportionnels aux unités-jardin", () => {
  expect(rectWOf(0)).toBe(0);
  expect(rectWOf(L_MAX)).toBeCloseTo(VIEW_W - PAD_L - PAD_R, 6);
  expect(rectHOf(0)).toBe(0);
  expect(rectHOf(H_MAX)).toBeCloseTo(VIEW_H - PAD_T - PAD_B, 6);
});

test("rectYOf : le rectangle est ancré sur le sol (rectY = baseY − rectH)", () => {
  expect(rectYOf(3)).toBeCloseTo(baseY - rectHOf(3), 6);
  // plus c'est haut, plus le coin haut-gauche monte (Y diminue)
  expect(rectYOf(5)).toBeLessThan(rectYOf(2));
});

test("aireOf : l'aire est le produit largeur × hauteur", () => {
  expect(aireOf(5, 3)).toBe(15);
  expect(aireOf(9, 6)).toBe(54);
});

test("dérivée partielle : pousser L de +1 ajoute H à l'aire (et inversement)", () => {
  const L = 5;
  const H = 3;
  // ∂aire/∂largeur = hauteur : +1 de largeur → +H d'aire
  expect(aireOf(L + 1, H) - aireOf(L, H)).toBe(H);
  // ∂aire/∂hauteur = largeur : +1 de hauteur → +L d'aire
  expect(aireOf(L, H + 1) - aireOf(L, H)).toBe(L);
});

test("partialLabel : la dérivée affichée est l'AUTRE côté", () => {
  expect(partialLabel("L", 5, 3)).toBe("∂aire/∂largeur = hauteur = 3,0");
  expect(partialLabel("H", 5, 3)).toBe("∂aire/∂hauteur = largeur = 5,0");
});

test("fmt : format français à 1 décimale (virgule)", () => {
  expect(fmt(5)).toBe("5,0");
  expect(fmt(3.25)).toBe("3,3"); // arrondi à 1 décimale
});

test("i18n EN : partialLabel anglais + point décimal (lang explicite)", () => {
  expect(partialLabel("L", 5, 3, "en")).toBe("∂area/∂width = height = 3.0");
  expect(partialLabel("H", 5, 3, "en")).toBe("∂area/∂height = width = 5.0");
  expect(fmt(5, "en")).toBe("5.0");
});

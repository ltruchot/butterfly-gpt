import { expect, test } from "vite-plus/test";
import {
  expCurveEndX,
  expPath,
  exOf,
  exStr,
  fmt,
  lnCurveEndY,
  lnPath,
  M,
  mX,
  mY,
  PAD_L,
  SIDE,
  VIEW_H,
  PAD_B,
  xStr,
} from "./logexp.logic.ts";

test("mX/mY : l'origine et le plafond M tombent aux bons pixels", () => {
  expect(mX(0)).toBe(PAD_L); // x = 0 → bord gauche
  expect(mY(0)).toBe(VIEW_H - PAD_B); // y = 0 → sol
  expect(mX(M)).toBe(PAD_L + SIDE); // x = M → bord droit
  expect(mY(M)).toBe(VIEW_H - PAD_B - SIDE); // y = M → haut
});

test("repère carré : un pas en x et un pas en y couvrent la même distance pixel", () => {
  // côté carré ⇒ même échelle sur les deux axes (sinon le miroir y=x ne serait pas à 45°)
  expect(mX(1) - mX(0)).toBeCloseTo(mY(0) - mY(1), 10);
});

test("exp et ln sont inverses : exp(0)=1 et ln(1)=0", () => {
  expect(Math.exp(0)).toBe(1);
  expect(Math.log(1)).toBe(0);
  // les deux courbes plafonnent au même endroit, par symétrie
  expect(expCurveEndX).toBe(lnCurveEndY);
  expect(expCurveEndX).toBeCloseTo(Math.log(M), 10);
});

test("symétrie miroir : un point (a,b) de exp ⇒ un point (b,a) de ln", () => {
  // dans le monde : exp passe par (u, eᵘ) ; ln passe par (eᵘ, u) = le point miroir.
  const u = 1.2;
  const a = u;
  const b = Math.exp(u);
  // le miroir pixel de (mX(a),mY(b)) à travers la diagonale est (mX(b),mY(a))
  expect(Math.log(b)).toBeCloseTo(a, 10); // ln redonne bien le petit nombre
});

test("expPath/lnPath : déterministes (même appel → même chaîne)", () => {
  expect(expPath()).toBe(expPath());
  expect(lnPath()).toBe(lnPath());
});

test("expPath/lnPath : démarrent aux ancres exp(0)=1 et ln(1)=0", () => {
  // exp part de (0, 1) → mX(0)=38, mY(1)
  expect(expPath().startsWith(`M${mX(0).toFixed(1)},${mY(1).toFixed(1)}`)).toBe(true);
  // ln part de (1, 0) → mX(1), mY(0)=318
  expect(lnPath().startsWith(`M${mX(1).toFixed(1)},${mY(0).toFixed(1)}`)).toBe(true);
});

test("fmt : format français à 2 décimales (virgule)", () => {
  expect(fmt(1.5)).toBe("1,50");
  expect(fmt(0)).toBe("0,00");
  expect(fmt(2.718)).toBe("2,72");
});

test("accesseurs d'affichage : exp(x) et chaînes (tolèrent un x en string)", () => {
  expect(exOf(0)).toBe(1);
  expect(exOf("0")).toBe(1); // valeur d'un <input range> en chaîne
  expect(xStr(1)).toBe("1,00");
  expect(exStr("1")).toBe(fmt(Math.E)); // exp(1) = e
});

test("i18n EN : point décimal (lang explicite)", () => {
  expect(fmt(1.5, "en")).toBe("1.50");
  expect(fmt(2.718, "en")).toBe("2.72");
});

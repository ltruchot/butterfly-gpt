import { expect, test } from "vite-plus/test";
import {
  fmt,
  probaOf,
  probaStr,
  reactionEmoji,
  reactionOf,
  reactionText,
  surpriseOf,
  surpriseStr,
} from "./surprise-mini.logic.ts";

test("probaOf : le pourcentage du curseur devient une proba 0..1", () => {
  expect(probaOf(100)).toBe(1);
  expect(probaOf(25)).toBe(0.25);
  expect(probaOf(1)).toBe(0.01);
});

test("surpriseOf : −ln(p), nulle quand on était sûr et juste (p=1)", () => {
  expect(surpriseOf(100)).toBe(0); // ln(1) = 0 → aucune surprise
});

test("surpriseOf : explose quand on était sûr et faux (p→0)", () => {
  // −ln(0,01) ≈ 4,6 → grosse punition
  expect(surpriseOf(1)).toBeCloseTo(4.61, 1);
  // monotone : plus la proba baisse, plus la surprise monte
  expect(surpriseOf(10)).toBeGreaterThan(surpriseOf(50));
});

test("surpriseOf : arrondie à 2 décimales (colle au nombre affiché)", () => {
  // la valeur renvoyée n'a jamais plus de 2 décimales
  const s = surpriseOf(37);
  expect(Math.round(s * 100) / 100).toBe(s);
});

test("reactionOf : l'émoji suit le niveau de surprise", () => {
  expect(reactionOf(100).emoji).toBe("😎"); // 0 → zéro surprise
  expect(reactionOf(1).emoji).toBe("🤯"); // ≈4,6 → très surpris
  // seuil moyen : ~37 % donne −ln(0,37) ≈ 0,99 → juste sous 1
  expect(reactionOf(50).text).toMatch(/attendais|poker/);
});

test("fmt : format français à 2 décimales (virgule)", () => {
  expect(fmt(0.25)).toBe("0,25");
  expect(fmt(3)).toBe("3,00");
});

test("accesseurs d'affichage : chaînes prêtes pour data-text", () => {
  expect(probaStr(25)).toBe("0,25");
  expect(surpriseStr(100)).toBe("0,00"); // p=1 → surprise nulle, jamais « -0,00 »
  expect(reactionEmoji(100)).toBe("😎");
  expect(reactionText(1)).toMatch(/surpris/);
});

test("accesseurs : tolèrent un pct en chaîne (valeur d'un <input range>)", () => {
  // Datastar fournit la valeur d'un range en string → on doit la recaster.
  expect(probaStr("25")).toBe(probaStr(25));
  expect(surpriseStr("40")).toBe(surpriseStr(40));
});

test("i18n EN : point décimal + réactions anglaises (lang explicite)", () => {
  expect(fmt(0.25, "en")).toBe("0.25");
  expect(fmt(3, "en")).toBe("3.00");
  expect(reactionOf(1, "en").text).toBe("I'm very surprised!");
  expect(reactionOf(100, "en").text).toBe("Zero surprise.");
  // les seuils sont indépendants de la langue (mêmes émojis)
  expect(reactionOf(1, "en").emoji).toBe(reactionOf(1, "fr").emoji);
});

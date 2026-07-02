import { expect, test } from "@playwright/test";
import { collectDatastarErrors, gotoAndSubscribe } from "./_helpers.ts";

test.beforeEach(async ({ request }) => {
  await request.post("/dataset/reset");
});

test("/dataset : initial render — phase Prêt, viewer vide, seul Collecter actif", async ({
  page,
}) => {
  const errors = collectDatastarErrors(page);
  await gotoAndSubscribe(page, "/dataset");

  await expect(page.getByTestId("phase")).toContainText("Prêt");
  await expect(page.getByTestId("entries")).toContainText("(clique sur Collecter pour démarrer)");
  await expect(page.getByTestId("collect")).not.toBeDisabled();
  await expect(page.getByTestId("clean")).toBeDisabled();
  await expect(page.getByTestId("shuffle")).toBeDisabled();
  expect(errors).toHaveLength(0);
});

test("/dataset : Collect → entrées brutes visibles, Clean activé", async ({ page }) => {
  const errors = collectDatastarErrors(page);
  await gotoAndSubscribe(page, "/dataset");

  await page.getByTestId("collect").click();
  await expect(page.getByTestId("phase")).toContainText("bruit visible");
  await expect(page.getByTestId("entries")).toContainText("Abraxas");
  await expect(page.getByTestId("clean")).not.toBeDisabled();
  expect(errors).toHaveLength(0);
});

test("/dataset : Clean → compteur descend, Shuffle activé", async ({ page }) => {
  const errors = collectDatastarErrors(page);
  await gotoAndSubscribe(page, "/dataset");

  await page.getByTestId("collect").click();
  const rawCount = Number(await page.getByTestId("raw-count").textContent());
  const cleanedCount = Number(await page.getByTestId("cleaned-count").textContent());
  expect(cleanedCount).toBeLessThan(rawCount);

  await page.getByTestId("clean").click();
  await expect(page.getByTestId("phase")).toContainText("Nettoyé");
  await expect(page.getByTestId("shuffle")).not.toBeDisabled();
  expect(errors).toHaveLength(0);
});

test("/dataset : Shuffle → 500 entrées, phase Mélangé", async ({ page }) => {
  const errors = collectDatastarErrors(page);
  await gotoAndSubscribe(page, "/dataset");

  await page.getByTestId("collect").click();
  await page.getByTestId("clean").click();
  await page.getByTestId("shuffle").click();

  await expect(page.getByTestId("phase")).toContainText("Mélangé");
  await expect(page.getByTestId("shuffled-count")).toHaveText("500");
  // 50 entrées affichées dans le pre (truncation pédagogique)
  const entries = await page.getByTestId("entries").textContent();
  const lines = (entries ?? "").split("\n").filter((l) => l.trim().length > 0);
  expect(lines.length).toBe(50);
  expect(errors).toHaveLength(0);
});

test("/dataset : stepper — item Dataset actif, autres accessibles", async ({ page }) => {
  await page.goto("/dataset");
  // L'item actif a la classe is-active sur le <li> parent du <a data-testid="step-dataset">
  const datasetLi = page.locator('li:has([data-testid="step-dataset"])');
  await expect(datasetLi).toHaveClass(/is-active/);
  const tokenizerLi = page.locator('li:has([data-testid="step-tokenizer"])');
  await expect(tokenizerLi).not.toHaveClass(/is-active/);
});

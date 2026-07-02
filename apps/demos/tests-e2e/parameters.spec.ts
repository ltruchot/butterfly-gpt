import { expect, test } from "@playwright/test";
import { collectDatastarErrors, gotoAndSubscribe } from "./_helpers.ts";

test.beforeEach(async ({ request }) => {
  await request.post("/parameters/reset");
});

test("/parameters : initial — pas de matrices, message Prêt", async ({ page }) => {
  const errors = collectDatastarErrors(page);
  await gotoAndSubscribe(page, "/parameters");

  await expect(page.getByTestId("phase")).toContainText("Prêt");
  await expect(page.getByTestId("matrices")).toHaveCount(0);
  expect(errors).toHaveLength(0);
});

test("/parameters : légende contextuelle « Du texte aux nombres » + MODEL_SNAPSHOT", async ({
  page,
}) => {
  // Le pont pédagogique microgpt « corpus → ids → embeddings → matrices »
  // vit ici (migré depuis /autograd). Doc-as-test.
  await gotoAndSubscribe(page, "/parameters");

  const legend = page.getByTestId("legend");
  await expect(legend).toContainText("Du texte aux nombres");
  await expect(legend).toContainText("papillons");
  await expect(legend).toContainText("azur");
  await expect(legend).toContainText("[1, 26, 21, 18]");
  await expect(legend).toContainText("tokenEmb");
  await expect(legend).toContainText("positionEmb");
  await expect(legend).toContainText("outputProj");
  await expect(legend).toContainText("n_bias = 0");
  await expect(legend).toContainText("Pourquoi 16 nombres");
  await expect(legend).toContainText("Tous bougent");

  const snapshot = page.getByTestId("legend-model-snapshot");
  await expect(snapshot).toContainText("Tables vivant en mémoire");
  await expect(snapshot).toContainText("tokenEmb");
  await expect(snapshot).toContainText("positionEmb");
  await expect(snapshot).toContainText("outputProj");
});

test("/parameters : Initialise → 2 matrices visibles, 16 cellules totales", async ({ page }) => {
  const errors = collectDatastarErrors(page);
  await gotoAndSubscribe(page, "/parameters");

  await page.getByTestId("next").click();
  await expect(page.getByTestId("phase")).toContainText("state_dict");
  await expect(page.getByTestId("matrices")).toBeVisible();
  // tokenEmb 4×2 = 8 cellules, outputProj 2×4 = 8 cellules, total 16
  const cells = page.locator("td.param-cell");
  await expect(cells).toHaveCount(16);
  expect(errors).toHaveLength(0);
});

test("/parameters : Aplatis → liste plate de 16 visible", async ({ page }) => {
  const errors = collectDatastarErrors(page);
  await gotoAndSubscribe(page, "/parameters");

  await page.getByTestId("next").click(); // initialise
  await page.getByTestId("next").click(); // aplatis
  await expect(page.getByTestId("phase")).toContainText("flattenParams");
  await expect(page.getByTestId("params-flat")).toBeVisible();
  await expect(page.getByTestId("params-flat")).toContainText("[0]");
  await expect(page.getByTestId("params-flat")).toContainText("[15]");
  expect(errors).toHaveLength(0);
});

test("/parameters : Backward → gradients affichés sur les cellules", async ({ page }) => {
  const errors = collectDatastarErrors(page);
  await gotoAndSubscribe(page, "/parameters");

  await page.getByTestId("next").click();
  await page.getByTestId("next").click();
  await page.getByTestId("next").click();
  await expect(page.getByTestId("phase")).toContainText("gradient");
  // Au moins une cellule avec ∂= (gradient affiché)
  await expect(page.locator("td.param-cell .grad").first()).toContainText("∂=");
  expect(errors).toHaveLength(0);
});

test("/parameters : Step (SGD) → 4 cellules surlignées avec data old → new", async ({ page }) => {
  const errors = collectDatastarErrors(page);
  await gotoAndSubscribe(page, "/parameters");

  for (let i = 0; i < 4; i++) await page.getByTestId("next").click();

  await expect(page.getByTestId("phase")).toContainText("nouveau state_dict");
  // 4 cellules avec class is-highlight
  await expect(page.locator("td.param-cell.is-highlight")).toHaveCount(4);
  // Les cellules ont à la fois .data.old et .data.new
  await expect(page.locator("td.param-cell .data.old").first()).toBeVisible();
  await expect(page.locator("td.param-cell .data.new").first()).toBeVisible();
  // Bouton next disabled
  await expect(page.getByTestId("next")).toBeDisabled();
  expect(errors).toHaveLength(0);
});

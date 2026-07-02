import { expect, test } from "@playwright/test";
import { clickNext, collectDatastarErrors, gotoAndSubscribe } from "./_helpers.ts";

test.beforeEach(async ({ request }) => {
  await request.post("/embeddings/reset");
});

test("/embeddings : initial — message Prêt, aucune table encore", async ({ page }) => {
  const errors = collectDatastarErrors(page);
  await gotoAndSubscribe(page, "/embeddings");

  await expect(page.getByTestId("phase")).toContainText("Prêt");
  await expect(page.getByTestId("token-table")).toHaveCount(0);
  expect(errors).toHaveLength(0);
});

test("/embeddings : légende — lookup, position, addition", async ({ page }) => {
  await gotoAndSubscribe(page, "/embeddings");

  const legend = page.getByTestId("legend");
  await expect(legend).toContainText("lookup tokenEmb");
  await expect(legend).toContainText("lookup positionEmb");
  await expect(legend).toContainText("addition");
  await expect(legend).toContainText("azur");
});

test("/embeddings : 1er Next → tokenEmb, ligne du token surlignée", async ({ page }) => {
  const errors = collectDatastarErrors(page);
  await gotoAndSubscribe(page, "/embeddings");

  await page.getByTestId("next").click();
  await expect(page.getByTestId("phase")).toContainText("tokenEmb");
  await expect(page.getByTestId("token-table")).toBeVisible();
  await expect(page.locator("#app tr.is-highlight-row")).toHaveCount(1);
  expect(errors).toHaveLength(0);
});

test("/embeddings : Next×2 → positionEmb apparaît", async ({ page }) => {
  const errors = collectDatastarErrors(page);
  await gotoAndSubscribe(page, "/embeddings");

  await clickNext(page, "/embeddings");
  await clickNext(page, "/embeddings");
  await expect(page.getByTestId("phase")).toContainText("positionEmb");
  await expect(page.getByTestId("pos-table")).toBeVisible();
  expect(errors).toHaveLength(0);
});

test("/embeddings : Next×3 → somme x affichée", async ({ page }) => {
  const errors = collectDatastarErrors(page);
  await gotoAndSubscribe(page, "/embeddings");

  await clickNext(page, "/embeddings");
  await clickNext(page, "/embeddings");
  await clickNext(page, "/embeddings");
  await expect(page.getByTestId("phase")).toContainText("addition");
  await expect(page.getByTestId("sum")).toBeVisible();
  expect(errors).toHaveLength(0);
});

test("/embeddings : on parcourt tout le mot → bouton Next désactivé à la fin", async ({ page }) => {
  const errors = collectDatastarErrors(page);
  await gotoAndSubscribe(page, "/embeddings");

  // « azur » = 4 lettres × 3 phases = 12 clics pour atteindre le dernier "summed".
  for (let i = 0; i < 12; i++) await clickNext(page, "/embeddings");
  await expect(page.getByTestId("next")).toBeDisabled();
  expect(errors).toHaveLength(0);
});

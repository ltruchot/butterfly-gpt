import { expect, test } from "@playwright/test";
import { clickNext, collectDatastarErrors, gotoAndSubscribe } from "./_helpers.ts";

test.beforeEach(async ({ request }) => {
  await request.post("/mlp/reset");
});

test("/mlp : initial — message Prêt, pas de compteur ReLU", async ({ page }) => {
  const errors = collectDatastarErrors(page);
  await gotoAndSubscribe(page, "/mlp");

  await expect(page.getByTestId("phase")).toContainText("Prêt");
  await expect(page.getByTestId("dead-count")).toHaveCount(0);
  expect(errors).toHaveLength(0);
});

test("/mlp : légende — expansion, ReLU, contraction", async ({ page }) => {
  await gotoAndSubscribe(page, "/mlp");
  const legend = page.getByTestId("legend");
  await expect(legend).toContainText("expansion");
  await expect(legend).toContainText("ReLU");
  await expect(legend).toContainText("contraction");
});

test("/mlp : Next → couche cachée dépliée", async ({ page }) => {
  const errors = collectDatastarErrors(page);
  await gotoAndSubscribe(page, "/mlp");
  await page.getByTestId("next").click();
  await expect(page.getByTestId("phase")).toContainText("projette");
  await expect(page.getByTestId("vectors")).toContainText("avant ReLU");
  expect(errors).toHaveLength(0);
});

test("/mlp : Next×2 → ReLU éteint des neurones (compteur visible)", async ({ page }) => {
  const errors = collectDatastarErrors(page);
  await gotoAndSubscribe(page, "/mlp");
  await clickNext(page, "/mlp");
  await clickNext(page, "/mlp");
  await expect(page.getByTestId("dead-count")).toBeVisible();
  await expect(page.getByTestId("dead-count")).toContainText("éteint");
  // au moins une cellule cachée marquée morte
  await expect(page.locator("td.param-cell.is-dead").first()).toBeVisible();
  expect(errors).toHaveLength(0);
});

test("/mlp : Next×3 → sortie de la taille d'entrée, Next désactivé", async ({ page }) => {
  const errors = collectDatastarErrors(page);
  await gotoAndSubscribe(page, "/mlp");
  await clickNext(page, "/mlp");
  await clickNext(page, "/mlp");
  await clickNext(page, "/mlp");
  await expect(page.getByTestId("vectors")).toContainText("sortie");
  await expect(page.getByTestId("next")).toBeDisabled();
  expect(errors).toHaveLength(0);
});

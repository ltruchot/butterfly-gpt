import { expect, test } from "@playwright/test";
import { clickNext, collectDatastarErrors, gotoAndSubscribe } from "./_helpers.ts";

test.beforeEach(async ({ request }) => {
  await request.post("/attention/reset");
});

test("/attention : initial — q/k/v affichés, pas encore de table d'attention", async ({ page }) => {
  const errors = collectDatastarErrors(page);
  await gotoAndSubscribe(page, "/attention");

  await expect(page.getByTestId("qkv")).toContainText("requête");
  await expect(page.getByTestId("qkv")).toContainText("clé");
  await expect(page.getByTestId("qkv")).toContainText("valeur");
  await expect(page.getByTestId("attn-table")).toHaveCount(0);
  expect(errors).toHaveLength(0);
});

test("/attention : légende — affinité, poids, sortie + causalité", async ({ page }) => {
  await gotoAndSubscribe(page, "/attention");
  const legend = page.getByTestId("legend");
  await expect(legend).toContainText("affinité");
  await expect(legend).toContainText("softmax");
  await expect(legend).toContainText("Causalité");
});

test("/attention : Next → scores q·k/√d affichés", async ({ page }) => {
  const errors = collectDatastarErrors(page);
  await gotoAndSubscribe(page, "/attention");
  await page.getByTestId("next").click();
  await expect(page.getByTestId("attn-table")).toContainText("q·k");
  expect(errors).toHaveLength(0);
});

test("/attention : Next×2 → poids softmax, « u » dominant surligné", async ({ page }) => {
  const errors = collectDatastarErrors(page);
  await gotoAndSubscribe(page, "/attention");
  await clickNext(page, "/attention");
  await clickNext(page, "/attention");
  await expect(page.getByTestId("attn-table")).toContainText("poids");
  // au moins une cellule surlignée (la colonne dominante « u »)
  await expect(page.getByTestId("attn-table").locator("td.is-highlight").first()).toBeVisible();
  expect(errors).toHaveLength(0);
});

test("/attention : Next×3 → vecteur de sortie, Next désactivé", async ({ page }) => {
  const errors = collectDatastarErrors(page);
  await gotoAndSubscribe(page, "/attention");
  await clickNext(page, "/attention");
  await clickNext(page, "/attention");
  await clickNext(page, "/attention");
  await expect(page.getByTestId("output")).toBeVisible();
  await expect(page.getByTestId("output")).toContainText("sortie");
  await expect(page.getByTestId("next")).toBeDisabled();
  expect(errors).toHaveLength(0);
});

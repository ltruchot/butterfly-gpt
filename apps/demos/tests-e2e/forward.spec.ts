import { expect, test } from "@playwright/test";
import { clickNext, collectDatastarErrors, gotoAndSubscribe } from "./_helpers.ts";

test.beforeEach(async ({ request }) => {
  await request.post("/forward/reset");
});

test("/forward : initial — pas encore d'étages", async ({ page }) => {
  const errors = collectDatastarErrors(page);
  await gotoAndSubscribe(page, "/forward");

  await expect(page.getByTestId("phase")).toContainText("travers tout le modèle");
  await expect(page.getByTestId("scores")).toHaveCount(0);
  expect(errors).toHaveLength(0);
});

test("/forward : légende — embedding, attention+résiduel, MLP+résiduel, scores", async ({
  page,
}) => {
  await gotoAndSubscribe(page, "/forward");
  const legend = page.getByTestId("legend");
  await expect(legend).toContainText("embedding");
  await expect(legend).toContainText("résiduel");
  await expect(legend).toContainText("scores");
});

test("/forward : Next×2 → étages embedding puis attention visibles", async ({ page }) => {
  const errors = collectDatastarErrors(page);
  await gotoAndSubscribe(page, "/forward");
  await clickNext(page, "/forward");
  await clickNext(page, "/forward");
  await expect(page.getByTestId("stages")).toContainText("après embedding");
  await expect(page.getByTestId("stages")).toContainText("après attention");
  expect(errors).toHaveLength(0);
});

test("/forward : jusqu'aux scores → lettre prédite affichée, Next désactivé", async ({ page }) => {
  const errors = collectDatastarErrors(page);
  await gotoAndSubscribe(page, "/forward");
  for (let i = 0; i < 4; i++) await clickNext(page, "/forward");
  await expect(page.getByTestId("scores")).toBeVisible();
  await expect(page.getByTestId("scores")).toContainText("lettre prédite");
  // Garde-fou : les scores recalculés étage par étage sont bien ceux de gpt().
  await expect(page.getByTestId("matches-gpt")).toContainText("✓ identique à gpt()");
  await expect(page.getByTestId("next")).toBeDisabled();
  expect(errors).toHaveLength(0);
});

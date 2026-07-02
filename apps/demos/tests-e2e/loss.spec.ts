import { expect, test } from "@playwright/test";
import { clickNext, collectDatastarErrors, gotoAndSubscribe } from "./_helpers.ts";

test.beforeEach(async ({ request }) => {
  await request.post("/loss/reset");
});

test("/loss : initial — contexte azu, scores affichés, pas encore de proba", async ({ page }) => {
  const errors = collectDatastarErrors(page);
  await gotoAndSubscribe(page, "/loss");

  await expect(page.getByTestId("phase")).toContainText("azu");
  await expect(page.getByTestId("candidates")).toContainText("score brut");
  await expect(page.getByTestId("candidates")).not.toContainText("proba (softmax)");
  expect(errors).toHaveLength(0);
});

test("/loss : légende — -log(proba), repère ln(vocabSize)", async ({ page }) => {
  await gotoAndSubscribe(page, "/loss");
  const legend = page.getByTestId("legend");
  await expect(legend).toContainText("-log");
  await expect(legend).toContainText("ln(vocabSize)");
});

test("/loss : Next → probabilités (softmax) affichées", async ({ page }) => {
  const errors = collectDatastarErrors(page);
  await gotoAndSubscribe(page, "/loss");
  await page.getByTestId("next").click();
  await expect(page.getByTestId("candidates")).toContainText("proba (softmax)");
  expect(errors).toHaveLength(0);
});

test("/loss : Next×2 → lettre cible « r » surlignée", async ({ page }) => {
  const errors = collectDatastarErrors(page);
  await gotoAndSubscribe(page, "/loss");
  await clickNext(page, "/loss");
  await clickNext(page, "/loss");
  await expect(page.getByTestId("phase")).toContainText("vraie lettre");
  await expect(page.locator("td.param-cell.is-highlight").first()).toBeVisible();
  expect(errors).toHaveLength(0);
});

test("/loss : Next×3 → valeur de loss + barème, Next désactivé", async ({ page }) => {
  const errors = collectDatastarErrors(page);
  await gotoAndSubscribe(page, "/loss");
  await clickNext(page, "/loss");
  await clickNext(page, "/loss");
  await clickNext(page, "/loss");
  await expect(page.getByTestId("loss-value")).toContainText("loss = -log");
  await expect(page.getByTestId("loss-scale")).toBeVisible();
  await expect(page.getByTestId("next")).toBeDisabled();
  expect(errors).toHaveLength(0);
});

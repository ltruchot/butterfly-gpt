import { expect, test } from "@playwright/test";
import { clickNext, collectDatastarErrors, gotoAndSubscribe } from "./_helpers.ts";

test.beforeEach(async ({ request }) => {
  await request.post("/rmsnorm/reset");
});

test("/rmsnorm : initial — message Prêt, pas de scalebox", async ({ page }) => {
  const errors = collectDatastarErrors(page);
  await gotoAndSubscribe(page, "/rmsnorm");

  await expect(page.getByTestId("phase")).toContainText("Prêt");
  await expect(page.getByTestId("scalebox")).toHaveCount(0);
  expect(errors).toHaveLength(0);
});

test("/rmsnorm : légende — carrés, facteur d'échelle, multiplication", async ({ page }) => {
  await gotoAndSubscribe(page, "/rmsnorm");
  const legend = page.getByTestId("legend");
  await expect(legend).toContainText("carrés");
  await expect(legend).toContainText("facteur d'échelle");
  await expect(legend).toContainText("direction");
});

test("/rmsnorm : Next → carrés affichés", async ({ page }) => {
  const errors = collectDatastarErrors(page);
  await gotoAndSubscribe(page, "/rmsnorm");
  await page.getByTestId("next").click();
  await expect(page.getByTestId("phase")).toContainText("carré");
  await expect(page.getByTestId("vectors")).toContainText("xᵢ²");
  expect(errors).toHaveLength(0);
});

test("/rmsnorm : Next×2 → scalebox avec ms et facteur", async ({ page }) => {
  const errors = collectDatastarErrors(page);
  await gotoAndSubscribe(page, "/rmsnorm");
  await clickNext(page, "/rmsnorm");
  await clickNext(page, "/rmsnorm");
  await expect(page.getByTestId("scalebox")).toBeVisible();
  await expect(page.getByTestId("scalebox")).toContainText("ms =");
  await expect(page.getByTestId("scalebox")).toContainText("facteur");
  expect(errors).toHaveLength(0);
});

test("/rmsnorm : Next×3 → sortie régulée, moyenne des carrés ≈ 1, Next désactivé", async ({
  page,
}) => {
  const errors = collectDatastarErrors(page);
  await gotoAndSubscribe(page, "/rmsnorm");
  await clickNext(page, "/rmsnorm");
  await clickNext(page, "/rmsnorm");
  await clickNext(page, "/rmsnorm");
  await expect(page.getByTestId("vectors")).toContainText("sortie");
  await expect(page.getByTestId("out-ms")).toContainText("1.0");
  await expect(page.getByTestId("next")).toBeDisabled();
  expect(errors).toHaveLength(0);
});

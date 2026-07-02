import { expect, test } from "@playwright/test";
import { clickNext, collectDatastarErrors, gotoAndSubscribe } from "./_helpers.ts";

test.beforeEach(async ({ request }) => {
  await request.post("/tokenizer/reset");
});

test("/tokenizer : initial — 30 entrées texte multiligne", async ({ page }) => {
  const errors = collectDatastarErrors(page);
  await gotoAndSubscribe(page, "/tokenizer");

  await expect(page.getByTestId("phase")).toContainText("30 entrées");
  const viewer = await page.getByTestId("viewer").textContent();
  const lines = (viewer ?? "").split("\n").filter((l) => l.trim().length > 0);
  expect(lines.length).toBe(30);
  expect(errors).toHaveLength(0);
});

test("/tokenizer : Convert → array de caractères, doublons inclus", async ({ page }) => {
  const errors = collectDatastarErrors(page);
  await gotoAndSubscribe(page, "/tokenizer");

  await page.getByTestId("next").click();
  await expect(page.getByTestId("phase")).toContainText("caractères au total");
  await expect(page.getByTestId("viewer")).toContainText('["');
  expect(errors).toHaveLength(0);
});

test("/tokenizer : Dedupe → ordre d'apparition préservé, count < flat", async ({ page }) => {
  const errors = collectDatastarErrors(page);
  await gotoAndSubscribe(page, "/tokenizer");

  await clickNext(page, "/tokenizer"); // convert
  await clickNext(page, "/tokenizer"); // dedupe
  await expect(page.getByTestId("phase")).toContainText("caractères uniques");
  await expect(page.getByTestId("phase")).toContainText("ordre d'apparition");
  expect(errors).toHaveLength(0);
});

test("/tokenizer : Sort → caractères triés", async ({ page }) => {
  const errors = collectDatastarErrors(page);
  await gotoAndSubscribe(page, "/tokenizer");

  await clickNext(page, "/tokenizer"); // convert
  await clickNext(page, "/tokenizer"); // dedupe
  await clickNext(page, "/tokenizer"); // sort
  await expect(page.getByTestId("phase")).toContainText("triés");
  expect(errors).toHaveLength(0);
});

test("/tokenizer : Show IDs + BOS — table char→id et BOS visible", async ({ page }) => {
  const errors = collectDatastarErrors(page);
  await gotoAndSubscribe(page, "/tokenizer");

  for (let i = 0; i < 4; i++) await clickNext(page, "/tokenizer");

  await expect(page.getByTestId("phase")).toContainText("BOS");
  await expect(page.getByTestId("viewer")).toContainText("// char → id");
  await expect(page.getByTestId("viewer")).toContainText("BOS — token sentinelle");
  await expect(page.getByTestId("next")).toBeDisabled();
  expect(errors).toHaveLength(0);
});

test("/tokenizer : Reset après progression → retour à initial", async ({ page }) => {
  const errors = collectDatastarErrors(page);
  await gotoAndSubscribe(page, "/tokenizer");

  for (let i = 0; i < 4; i++) await clickNext(page, "/tokenizer");
  await expect(page.getByTestId("phase")).toContainText("BOS");

  await page.getByTestId("reset").click();
  await expect(page.getByTestId("phase")).toContainText("30 entrées");
  expect(errors).toHaveLength(0);
});

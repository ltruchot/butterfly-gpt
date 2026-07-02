import { expect, test } from "@playwright/test";
import { collectDatastarErrors, gotoAndSubscribe } from "./_helpers.ts";

// L'état est un singleton serveur : on repart de x = 1 avant chaque test.
test.beforeEach(async ({ request }) => {
  await request.post("/logarithme/reset");
});

test("/logarithme : rendu initial — x = 1, ln(1.00) = 0.00", async ({ page }) => {
  const errors = collectDatastarErrors(page);
  await gotoAndSubscribe(page, "/logarithme");

  await expect(page.getByTestId("x-slider")).toHaveValue("1");
  await expect(page.getByTestId("readout")).toContainText("ln(1.00)");
  await expect(page.getByTestId("readout")).toContainText("0.00");
  expect(errors).toHaveLength(0);
});

test("/logarithme : slider → x = e ≈ 2.7 — ln proche de 1", async ({ page }) => {
  const errors = collectDatastarErrors(page);
  await gotoAndSubscribe(page, "/logarithme");

  // fill déclenche déjà `input` ; on re-dispatch pour blinder le debounce.
  const slider = page.getByTestId("x-slider");
  await slider.fill("2.7");
  await slider.dispatchEvent("input");

  // Le readout est ré-rendu serveur puis morphé via SSE — on poll le texte.
  await expect(page.getByTestId("readout")).toContainText("ln(2.70)");
  await expect(page.getByTestId("readout")).toContainText("0.99"); // ln(2.7) ≈ 0.993
  expect(errors).toHaveLength(0);
});

test("/logarithme : reset — retour à x = 1", async ({ page }) => {
  const errors = collectDatastarErrors(page);
  await gotoAndSubscribe(page, "/logarithme");

  const slider = page.getByTestId("x-slider");
  await slider.fill("2.7");
  await slider.dispatchEvent("input");
  await expect(page.getByTestId("readout")).toContainText("ln(2.70)");

  const resp = page.waitForResponse((r) => r.url().includes("/logarithme/reset"));
  await page.getByTestId("reset").click();
  await resp;

  await expect(page.getByTestId("readout")).toContainText("ln(1.00)");
  await expect(page.getByTestId("readout")).toContainText("0.00");
  expect(errors).toHaveLength(0);
});

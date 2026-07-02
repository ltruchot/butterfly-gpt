import { expect, test } from "@playwright/test";
import { collectDatastarErrors, gotoAndSubscribe } from "./_helpers.ts";

// L'état est un singleton serveur : on repart de 40° avant chaque test.
test.beforeEach(async ({ request }) => {
  await request.post("/produit-scalaire/reset");
});

test("/produit-scalaire : rendu initial — 40°, a·b = cos 40° ≈ 0.77, verdict aigu", async ({
  page,
}) => {
  const errors = collectDatastarErrors(page);
  await gotoAndSubscribe(page, "/produit-scalaire");

  await expect(page.getByTestId("angle-slider")).toHaveValue("40");
  await expect(page.getByTestId("readout")).toContainText("cos 40°");
  await expect(page.getByTestId("readout")).toContainText("0.77"); // cos(40°) ≈ 0.766
  await expect(page.getByTestId("verdict")).toContainText("aigu");
  expect(errors).toHaveLength(0);
});

test("/produit-scalaire : slider → 180° — a·b = -1.00, verdict opposées", async ({ page }) => {
  const errors = collectDatastarErrors(page);
  await gotoAndSubscribe(page, "/produit-scalaire");

  // fill déclenche déjà `input` ; on re-dispatch pour blinder le debounce.
  const slider = page.getByTestId("angle-slider");
  await slider.fill("180");
  await slider.dispatchEvent("input");

  // Le readout est ré-rendu serveur puis morphé via SSE — on poll le texte.
  await expect(page.getByTestId("readout")).toContainText("cos 180°");
  await expect(page.getByTestId("readout")).toContainText("-1.00");
  await expect(page.getByTestId("verdict")).toContainText("opposées");
  expect(errors).toHaveLength(0);
});

test("/produit-scalaire : reset — retour à 40°", async ({ page }) => {
  const errors = collectDatastarErrors(page);
  await gotoAndSubscribe(page, "/produit-scalaire");

  const slider = page.getByTestId("angle-slider");
  await slider.fill("180");
  await slider.dispatchEvent("input");
  await expect(page.getByTestId("readout")).toContainText("cos 180°");

  const resp = page.waitForResponse((r) => r.url().includes("/produit-scalaire/reset"));
  await page.getByTestId("reset").click();
  await resp;

  await expect(page.getByTestId("readout")).toContainText("cos 40°");
  await expect(page.getByTestId("verdict")).toContainText("aigu");
  expect(errors).toHaveLength(0);
});

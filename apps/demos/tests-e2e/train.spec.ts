import { expect, test } from "@playwright/test";
import { collectDatastarErrors, gotoAndSubscribe } from "./_helpers.ts";

test.beforeEach(async ({ request }) => {
  await request.post("/train/reset");
});

test("/train : initial — Prêt, compteur à 0", async ({ page }) => {
  const errors = collectDatastarErrors(page);
  await gotoAndSubscribe(page, "/train");

  await expect(page.getByTestId("phase")).toContainText("Prêt");
  await expect(page.getByTestId("step-counter")).toContainText("0 /");
  await expect(page.getByTestId("chart")).toBeVisible();
  expect(errors).toHaveLength(0);
});

test("/train : légende — forward, backward, Adam, courbe en direct", async ({ page }) => {
  await gotoAndSubscribe(page, "/train");
  const legend = page.getByTestId("legend");
  await expect(legend).toContainText("forward");
  await expect(legend).toContainText("backward");
  await expect(legend).toContainText("Adam");
  await expect(legend).toContainText("en direct");
});

test("/train : Entraîner → la loss se trace en live et l'entraînement se termine", async ({
  page,
}) => {
  const errors = collectDatastarErrors(page);
  await gotoAndSubscribe(page, "/train");

  await page.getByTestId("start").click();

  // Le compteur progresse (live SSE).
  await expect
    .poll(
      async () => {
        const txt = (await page.getByTestId("step-counter").textContent()) ?? "";
        const m = txt.match(/(\d+)\s*\//);
        return m ? Number(m[1]) : 0;
      },
      { timeout: 10_000 },
    )
    .toBeGreaterThan(5);

  // Puis l'entraînement se termine et le bouton redevient actif.
  await expect(page.getByTestId("phase")).toContainText("Terminé", { timeout: 30_000 });
  await expect(page.getByTestId("start")).toBeEnabled();
  // Une courbe (polyline orange = EMA) a été tracée.
  await expect(page.getByTestId("chart").locator("polyline")).toHaveCount(2);
  expect(errors).toHaveLength(0);
});

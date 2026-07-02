import { expect, test } from "@playwright/test";
import { BASE, collectErrors } from "./_helpers.ts";

// ═══════════════════════════════════════════════════════════════════════════
// Routing miroir /fr · /en — le segment de langue de l'URL pilote le rendu, et
// PERSISTE pendant la navigation (afterEach ré-injecte le préfixe). Cf.
// setup/routes.ts + setup/main.ts.
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Routing i18n", () => {
  test("/fr/1 rend le français, /en/1 rend l'anglais", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto(`${BASE}/fr/1`, { waitUntil: "networkidle" });
    await expect(page.locator(".slidev-page-1")).toContainText(/MicroGPT De Karpathy/i);

    await page.goto(`${BASE}/en/1`, { waitUntil: "networkidle" });
    await expect(page.locator(".slidev-page-1")).toContainText(/Karpathy's MicroGPT/i);

    expect(errors).toHaveLength(0);
  });

  test("l'URL nue redirige vers /fr/1 (langue par défaut = FR)", async ({ page }) => {
    await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/\/fr\/1$/);
  });

  test("deep-link /en/2 rend l'anglais au rafraîchissement", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto(`${BASE}/en/2`, { waitUntil: "networkidle" });
    await expect(page.locator(".slidev-page-2")).toContainText(/The butterfly and the sage/i);
    expect(errors).toHaveLength(0);
  });

  test("le préfixe /en/ PERSISTE en passant à la slide suivante", async ({ page }) => {
    await page.goto(`${BASE}/en/1`, { waitUntil: "networkidle" });
    await expect(page.locator(".slidev-page-1")).toBeVisible();
    // la cover n'a pas de v-click → flèche droite = slide suivante
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/\/en\/2/); // toujours préfixé /en/, pas /2 nu
    await expect(page.locator(".slidev-page-2")).toContainText(/The butterfly and the sage/i);
  });
});

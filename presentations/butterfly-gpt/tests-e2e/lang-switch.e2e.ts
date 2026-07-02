import { expect, test } from "@playwright/test";
import { BASE, collectErrors } from "./_helpers.ts";

// ═══════════════════════════════════════════════════════════════════════════
// Sélecteur de langue (composant LangSwitch, monté sur la cover) : la bascule
// change le texte EN DIRECT et met l'URL en miroir (un seul saut). Cf.
// components/LangSwitch.vue.
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Sélecteur de langue", () => {
  test("FR → EN : bascule le texte rendu ET met l'URL en /en/1", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto(`${BASE}/fr/1`, { waitUntil: "networkidle" });
    const cover = page.locator(".slidev-page-1");
    await expect(cover).toContainText(/MicroGPT De Karpathy/i); // état FR

    await cover.locator(".lang-switch button", { hasText: "EN" }).click();
    await page.waitForTimeout(400);

    await expect(cover).toContainText(/Karpathy's MicroGPT/i); // bascule en direct
    await expect(page).toHaveURL(/\/en\/1$/); // URL miroir
    expect(errors).toHaveLength(0);
  });

  test("EN → FR : rebascule", async ({ page }) => {
    await page.goto(`${BASE}/en/1`, { waitUntil: "networkidle" });
    const cover = page.locator(".slidev-page-1");
    await expect(cover).toContainText(/Karpathy's MicroGPT/i);

    await cover.locator(".lang-switch button", { hasText: "FR" }).click();
    await page.waitForTimeout(400);

    await expect(cover).toContainText(/MicroGPT De Karpathy/i);
    await expect(page).toHaveURL(/\/fr\/1$/);
  });
});

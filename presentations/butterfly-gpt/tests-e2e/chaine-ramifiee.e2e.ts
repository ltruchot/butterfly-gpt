import { expect, test } from "@playwright/test";
import { collectErrors, gotoSlide, setRange, SLIDE } from "./_helpers.ts";

// ═══════════════════════════════════════════════════════════════════════════
// Annexe « Règle de la chaîne multivariable » : ChaineRamifiee, sans v-click.
// Accélérer un véhicule (vélo ×) augmente le cumul des dérivées (la pente).
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Slide règle de la chaîne", () => {
  test("ChaineRamifiee : accélérer le vélo change le cumul (la pente)", async ({ page }) => {
    const errors = collectErrors(page);
    const slide = await gotoSlide(page, SLIDE.chaineRamifiee);

    const widget = slide.locator(".ram");
    await expect(widget).toBeVisible();

    const readout = widget.locator(".readout");
    const before = await readout.textContent();

    // 2e curseur « .sl-velo » = la VITESSE du vélo (le 1er = le nombre de jours).
    // L'augmenter amplifie vélo ET voiture (×bike×car) → le total grimpe.
    await setRange(page, widget.locator(".sl-velo").nth(1), 6);
    await expect.poll(async () => (await readout.textContent()) !== before).toBe(true);

    expect(errors).toHaveLength(0);
  });
});

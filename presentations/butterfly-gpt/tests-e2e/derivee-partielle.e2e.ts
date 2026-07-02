import { expect, test } from "@playwright/test";
import { collectErrors, gotoSlide, setRange, SLIDE } from "./_helpers.ts";

// ═══════════════════════════════════════════════════════════════════════════
// Annexe « La dérivée partielle » : DeriveePartiellePapillon, sans v-click.
// On pousse un seul côté (largeur) et la lecture (aire + ∂) doit suivre.
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Slide dérivée partielle", () => {
  test("DeriveePartiellePapillon : pousser la largeur change l'aire affichée", async ({ page }) => {
    const errors = collectErrors(page);
    const slide = await gotoSlide(page, SLIDE.deriveePartielle);

    const widget = slide.locator(".part");
    await expect(widget).toBeVisible();

    const readout = widget.locator(".readout");
    const before = await readout.textContent();

    await setRange(page, widget.locator(".slider-l"), 8);
    await expect.poll(async () => (await readout.textContent()) !== before).toBe(true);

    expect(errors).toHaveLength(0);
  });
});

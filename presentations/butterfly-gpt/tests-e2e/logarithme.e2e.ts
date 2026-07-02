import { expect, test } from "@playwright/test";
import { collectErrors, gotoSlide, setRange, SLIDE } from "./_helpers.ts";

// ═══════════════════════════════════════════════════════════════════════════
// Slide « Exponentielle VS Logarithme » (1b-logarithme) : deux widgets, sans
// v-click → visibles d'emblée. Filet de non-régression AVANT passage Datastar.
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Slide logarithme", () => {
  test("bgpt-sfx : le lettrage SFX (web component) rend son texte sans warning Vue", async ({
    page,
  }) => {
    const errors = collectErrors(page);
    const slide = await gotoSlide(page, SLIDE.logarithme);

    // le <bgpt-sfx text="VS"> du titre rend un <span class="sfx"> avec le texte ;
    // si Vue tentait de le résoudre comme composant, collectErrors le verrait.
    const sfx = slide.locator('bgpt-sfx[text="VS"] span.sfx');
    await expect(sfx).toHaveText("VS");

    expect(errors).toHaveLength(0);
  });

  test("LogExpPapillon : le curseur fait bouger la lecture exp/ln", async ({ page }) => {
    const errors = collectErrors(page);
    const slide = await gotoSlide(page, SLIDE.logarithme);

    const widget = slide.locator(".logexp");
    await expect(widget).toBeVisible();

    const readout = widget.locator(".readout");
    const before = await readout.textContent();

    // glisse le curseur vers une autre valeur de x → exp(x)/ln(x) doivent changer
    await setRange(page, widget.locator('input[type="range"]'), 1.6);
    await expect.poll(async () => (await readout.textContent()) !== before).toBe(true);

    expect(errors).toHaveLength(0);
  });

  test("SurpriseMini : le curseur fait bouger −ln(proba)", async ({ page }) => {
    const errors = collectErrors(page);
    const slide = await gotoSlide(page, SLIDE.logarithme);

    const widget = slide.locator(".surprise-mini");
    await expect(widget).toBeVisible();

    const chip = widget.locator(".sm-chip");
    const before = await chip.textContent();

    // 100 % → surprise 0 ; on descend à 25 % → la surprise doit grimper
    await setRange(page, widget.locator(".sm-slider"), 25);
    await expect.poll(async () => (await chip.textContent()) !== before).toBe(true);

    expect(errors).toHaveLength(0);
  });
});

import { expect, test } from "@playwright/test";
import { collectErrors, gotoSlide, revealClicks, setRange, SLIDE } from "./_helpers.ts";

// ═══════════════════════════════════════════════════════════════════════════
// Slide « La dérivée » (6c-la-derivee) : DeriveePapillon est derrière v-click=4
// ET remonte la dérivée δ vers la slide (v-model:delta → {{ delta }} dans le
// cartouche .panel-ink). On verrouille LES DEUX : la réaction du widget ET le
// pont δ — c'est le comportement délicat à préserver lors du passage Datastar.
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Slide dérivée", () => {
  test("DeriveePapillon : le curseur déplace le papillon et met à jour δ", async ({ page }) => {
    const errors = collectErrors(page);
    const slide = await gotoSlide(page, SLIDE.derivee);
    await revealClicks(page, 4); // boss(1) + définition(2) + formule(3) + widget+δ(4)

    const widget = slide.locator(".deriv");
    await expect(widget).toBeVisible();

    // le cartouche δ remonté depuis le widget (v-model:delta)
    const delta = slide.locator(".panel-ink");
    const readout = widget.locator(".readout");
    const deltaBefore = await delta.textContent();
    const readoutBefore = await readout.textContent();

    // glisse le temps vers la fin du vol (la pente s'aplatit → δ doit changer)
    await setRange(page, widget.locator('input[type="range"]'), 9);

    await expect.poll(async () => (await readout.textContent()) !== readoutBefore).toBe(true);
    await expect.poll(async () => (await delta.textContent()) !== deltaBefore).toBe(true);

    expect(errors).toHaveLength(0);
  });

  test("DeriveePapillon : GLISSER le papillon fait avancer le slider (pont drag→signal)", async ({
    page,
  }) => {
    const errors = collectErrors(page);
    const slide = await gotoSlide(page, SLIDE.derivee);
    await revealClicks(page, 4);

    const slider = slide.locator(".deriv input[type='range']");
    const before = await slider.inputValue();

    // glisser le papillon sur sa courbe (pointer drag sur le SVG du web component)
    const svg = await slide.locator("bgpt-derivee svg").first().boundingBox();
    if (!svg) throw new Error("svg dérivée introuvable");
    await page.mouse.move(svg.x + svg.width * 0.25, svg.y + svg.height * 0.6);
    await page.mouse.down();
    await page.mouse.move(svg.x + svg.width * 0.8, svg.y + svg.height * 0.6, { steps: 8 });
    await page.mouse.up();

    // le drag pousse $t dans le signal → le slider (data-bind:t) doit avoir suivi
    await expect.poll(async () => (await slider.inputValue()) !== before).toBe(true);

    expect(errors).toHaveLength(0);
  });
});

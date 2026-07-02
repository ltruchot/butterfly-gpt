import { expect, test } from "@playwright/test";
import { collectErrors, gotoSlide, SLIDE } from "./_helpers.ts";

// ═══════════════════════════════════════════════════════════════════════════
// annexe-schema — le forward pass en un schéma (façon microgpt-excel).
// Les tooltips sont en pur CSS :hover : on exerce le survol réel (la tooltip
// apparaît, avec le wording de la bonne langue) + garde zéro erreur console.
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Annexe — le modèle en un schéma", () => {
  test("les 4 colonnes du pipeline sont rendues (FR)", async ({ page }) => {
    const errors = collectErrors(page);
    const slide = await gotoSlide(page, SLIDE.schema, "fr");

    await expect(slide).toContainText("Le modèle en un schéma");
    for (const brick of ["tokenEmb", "attn_wq", "mlp_fc1", "outputProj"]) {
      await expect(slide.locator(".bk", { hasText: brick }).first()).toBeVisible();
    }
    expect(errors).toHaveLength(0);
  });

  test("survol d'une brique → la tooltip apparaît, et disparaît ailleurs", async ({ page }) => {
    const errors = collectErrors(page);
    const slide = await gotoSlide(page, SLIDE.schema, "fr");

    const wq = slide.locator(".bk", { hasText: "attn_wq" });
    const tip = wq.locator(".tip");
    await expect(tip).toBeHidden();
    await wq.hover();
    await expect(tip).toBeVisible();
    await expect(tip).toContainText("je cherche quoi ?");

    // Le survol d'une autre brique referme la première tooltip.
    // NB : cible « ReLU » car hasText voit AUSSI le texte des tooltips cachées
    // (« softmax », p. ex., apparaît dans la tooltip de la brique attention).
    await slide.locator(".bk", { hasText: "ReLU" }).hover();
    await expect(tip).toBeHidden();
    expect(errors).toHaveLength(0);
  });

  test("tooltips traduites : « tire au sort » ⇄ « draw at random »", async ({ page }) => {
    const fr = await gotoSlide(page, SLIDE.schema, "fr");
    await fr.locator(".bk", { hasText: "🎲" }).hover();
    await expect(fr.locator(".tip", { hasText: "tire au sort" })).toBeVisible();

    const en = await gotoSlide(page, SLIDE.schema, "en");
    await en.locator(".bk", { hasText: "🎲" }).hover();
    await expect(en.locator(".tip", { hasText: "draw at random" })).toBeVisible();
  });
});

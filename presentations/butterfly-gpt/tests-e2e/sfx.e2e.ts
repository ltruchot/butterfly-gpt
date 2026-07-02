import { expect, test } from "@playwright/test";
import { collectErrors, gotoSlide, revealClicks } from "./_helpers.ts";

// ═══════════════════════════════════════════════════════════════════════════
// <bgpt-sfx> — garde-fous de mise en page (régressions vécues à la conversion).
// Le host est `display:contents` → le <span.sfx> redevient l'élément direct,
// EXACTEMENT comme l'ancien <Sfx> Vue (un seul span). Sans ça : double
// inline-block imbriqué (texte à espaces qui s'empile) et flex cassé (le SFX ne
// pousse plus le texte suivant).
// ═══════════════════════════════════════════════════════════════════════════

// Indices de slide (ordre de slides.md) : 4a-atomiser, 6a-mort-vivant.
const SLIDE_ATOMISER = 16;
const SLIDE_MORT_VIVANT = 23;

test.describe("Mise en page <bgpt-sfx>", () => {
  test("« B . O . S » (texte à espaces, class=inline-block) reste HORIZONTAL", async ({ page }) => {
    const errors = collectErrors(page);
    const slide = await gotoSlide(page, SLIDE_ATOMISER);
    await revealClicks(page, 2);

    const box = await slide.locator("span.sfx", { hasText: "B . O . S" }).first().boundingBox();
    expect(box).not.toBeNull();
    // horizontal = plus large que haut (l'empilement vertical donnait ~25×67)
    expect(box!.width).toBeGreaterThan(box!.height);

    expect(errors).toHaveLength(0);
  });

  test("le SFX d'un titre flex POUSSE le texte suivant (pas de chevauchement)", async ({
    page,
  }) => {
    const errors = collectErrors(page);
    const slide = await gotoSlide(page, SLIDE_MORT_VIVANT);
    await revealClicks(page, 2);

    const mort = await slide.locator("span.sfx", { hasText: "mort" }).first().boundingBox();
    const inf = await slide
      .locator("span.label-ink", { hasText: "inférence" })
      .first()
      .boundingBox();
    expect(mort).not.toBeNull();
    expect(inf).not.toBeNull();
    // « : inférence » commence APRÈS la fin de « mort » (le SFX occupe sa largeur)
    expect(inf!.x).toBeGreaterThanOrEqual(mort!.x + mort!.width - 2);

    expect(errors).toHaveLength(0);
  });
});

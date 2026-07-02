import { expect, test } from "@playwright/test";
import { collectErrors, gotoSlide, SLIDE } from "./_helpers.ts";

// ═══════════════════════════════════════════════════════════════════════════
// Pages traduites — quelques slides représentatives rendues dans les deux
// langues : prose, format de nombre localisé (virgule FR / point EN), et un
// libellé de démo en bloc v-pre (résolu via window.bgpt.t).
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Pages traduites FR / EN", () => {
  test("prose : « Le papillon et le sage » ⇄ « The butterfly and the sage »", async ({ page }) => {
    const fr = await gotoSlide(page, 2, "fr");
    await expect(fr).toContainText("Le papillon et le sage");

    const en = await gotoSlide(page, 2, "en");
    await expect(en).toContainText("The butterfly and the sage");
  });

  test("format de nombre : virgule en FR, point en EN (chip −ln)", async ({ page }) => {
    const errors = collectErrors(page);
    // pct=100 par défaut → proba 1,00 et surprise 0,00 (FR) / 1.00 et 0.00 (EN)
    const fr = await gotoSlide(page, SLIDE.logarithme, "fr");
    await expect(fr.locator(".sm-chip")).toContainText("0,00");

    const en = await gotoSlide(page, SLIDE.logarithme, "en");
    await expect(en.locator(".sm-chip")).toContainText("0.00");

    expect(errors).toHaveLength(0);
  });

  test("libellé de démo v-pre : « miroir de » ⇄ « mirror of »", async ({ page }) => {
    const fr = await gotoSlide(page, SLIDE.logarithme, "fr");
    await expect(fr.locator(".logexp .arrow")).toContainText(/miroir de/);

    const en = await gotoSlide(page, SLIDE.logarithme, "en");
    await expect(en.locator(".logexp .arrow")).toContainText(/mirror of/);
  });
});

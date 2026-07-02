import { expect, test } from "@playwright/test";
import { collectErrors, gotoSlide, revealClicks, SLIDE } from "./_helpers.ts";

// ═══════════════════════════════════════════════════════════════════════════
// Slide « Paramètres en 3D » (5b-parameters-3d) : ParamCloud3D (three.js).
// Pas de curseur — on vérifie que le nuage se monte (canvas + compte de
// paramètres) et qu'un re-tirage ne casse rien (aucune erreur console).
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Slide paramètres 3D", () => {
  test("ParamCloud3D : le nuage se monte et le re-tirage ne lève pas d'erreur", async ({
    page,
  }) => {
    const errors = collectErrors(page);
    const slide = await gotoSlide(page, SLIDE.parametres3d);
    await revealClicks(page, 1); // <ParamCloud3D v-click="1" />

    const widget = slide.locator(".cloud");
    await expect(widget).toBeVisible();

    // un VRAI modèle est construit → le compte de paramètres est affiché (> 0)
    await expect(widget.locator(".tag")).toContainText(/\d/);
    // three.js a injecté son <canvas> dans l'hôte
    await expect(widget.locator(".cloud-canvas canvas")).toBeVisible();

    // re-tirage : reconstruit les buffers — ne doit rien casser. `force` car le
    // <div> hôte du canvas (qui capte le glisser-pour-tourner) recouvre la zone.
    await widget.getByRole("button", { name: /nouveau tirage/ }).click({ force: true });
    await page.waitForTimeout(300);

    expect(errors).toHaveLength(0);
  });
});

import { expect, test } from "@playwright/test";
import { collectErrors, gotoSlide, setRange, SLIDE } from "./_helpers.ts";

// ═══════════════════════════════════════════════════════════════════════════
// Slide « Tirage gaussien » (5aa) : <bgpt-tirage>, cible de fléchettes Box-Muller
// 100 % Datastar (signaux throw1/throw50/throw500/reset + curseur σ). Le filet
// VERROUILLE le comportement câblé ET surtout la NON-RÉGRESSION de l'emballement :
// un clic = UN impact, jamais une boucle qui crache 10000 points d'un coup
// (cause : #emit ré-écrit des signaux → ré-pose du data-attr → ré-entrée). La
// garde « zéro erreur console » attrape aussi le « InternalError: too much
// recursion » qu'une régression rouvrirait.
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Slide tirage gaussien", () => {
  test("bgpt-tirage : 1 clic = 1 impact (anti-emballement), +50, σ, reset", async ({ page }) => {
    const errors = collectErrors(page);
    const slide = await gotoSlide(page, SLIDE.tirage);

    const tirage = slide.locator("bgpt-tirage");
    await expect(tirage).toBeVisible();
    const circles = tirage.locator("circle");

    // État initial : seulement les 3 anneaux fixes (aucun impact).
    await expect(circles).toHaveCount(3);

    // 1 clic « lancer » → exactement 1 impact (+ le marqueur du dernier tir) :
    // un nuage borné, PAS un emballement vers 10000. C'est LE cœur du non-reg.
    await slide.locator("button.btn-crimson").click();
    await expect.poll(async () => circles.count()).toBeGreaterThan(3);
    expect(await circles.count()).toBeLessThan(20);

    // La lecture du dernier tir apparaît (data-show $hasLast) avec un nombre.
    const readout = slide.locator(".codechip").first();
    await expect(readout).toBeVisible();
    await expect(readout).toContainText(/[0-9]/);

    // +50 → ~50 impacts de plus, toujours BORNÉ (pas de runaway).
    await slide.locator("button.btn-amber").first().click();
    await expect.poll(async () => circles.count()).toBeGreaterThan(40);
    expect(await circles.count()).toBeLessThan(200);

    // σ : bouger le curseur reprojette le nuage et met à jour la pastille.
    const tag = slide.locator(".tag").first();
    const sigmaBefore = await tag.textContent();
    await setRange(page, slide.locator('input[type="range"]'), 0.16);
    await expect.poll(async () => (await tag.textContent()) !== sigmaBefore).toBe(true);

    // reset (↻) → retour aux seuls anneaux.
    await slide.locator("button", { hasText: "↻" }).click();
    await expect(circles).toHaveCount(3);

    // Aucune erreur runtime — y compris « too much recursion » si l'emballement revenait.
    expect(errors).toHaveLength(0);
  });
});

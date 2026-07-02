import { expect, test } from "@playwright/test";
import { collectDatastarErrors, gotoAndSubscribe } from "./_helpers.ts";

// ═══════════════════════════════════════════════════════════════════════════
// /derivee — le skieur dans le brouillard (descente de gradient 1D, SSE).
// L'état est un singleton serveur partagé : chaque test repart d'un état
// propre (w=1, trace vide, η=0,5) via POST /derivee/reset.
// ═══════════════════════════════════════════════════════════════════════════

test.beforeEach(async ({ request }) => {
  await request.post("/derivee/reset");
});

// Règle η en simulant le geste utilisateur : valeur + événement input, ce qui
// exerce data-bind:eta ET le data-on:input (débouncé) qui POST /derivee/eta.
const setEta = async (page: import("@playwright/test").Page, value: string): Promise<void> => {
  const etaResp = page.waitForResponse((r) => r.url().includes("/derivee/eta"));
  await page.locator("#eta-slider").evaluate((el, v) => {
    const input = el as HTMLInputElement;
    input.value = v;
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, value);
  await etaResp;
};

test("/derivee : rendu initial — w=1,00, statut vide, courbe présente", async ({ page }) => {
  const errors = collectDatastarErrors(page);
  await gotoAndSubscribe(page, "/derivee");

  await expect(page.getByTestId("readout-w")).toHaveText("1,00");
  await expect(page.getByTestId("status")).toHaveText("");
  await expect(page.getByTestId("scene").locator("path.curve-revealed")).toBeVisible();
  expect(errors).toHaveLength(0);
});

test("/derivee : « un pas » → le readout bouge (morph SSE reçu)", async ({ page }) => {
  const errors = collectDatastarErrors(page);
  await gotoAndSubscribe(page, "/derivee");

  const resp = page.waitForResponse((r) => r.url().includes("/derivee/step"));
  await page.getByTestId("step-once").click();
  await resp;

  // w ← 1 − 0,5 · 0,6 · (1 − 5) = 1 + 1,2 = 2,2 (η initial = 0,5).
  await expect.poll(async () => page.getByTestId("readout-w").textContent()).toBe("2,20");
  // Pente recalculée au nouveau point : 0,6 · (2,2 − 5) = −1,68. On asserte
  // sur « 1,68 » pour rester neutre vis-à-vis du glyphe du signe moins.
  await expect(page.getByTestId("readout-slope")).toContainText("1,68");
  expect(errors).toHaveLength(0);
});

test("/derivee : slider η → le pas suivant est amplifié en conséquence", async ({ page }) => {
  const errors = collectDatastarErrors(page);
  await gotoAndSubscribe(page, "/derivee");

  await setEta(page, "2");
  // Le serveur re-broadcast : l'affichage de η passe à 2,00.
  await expect(page.locator("#eta-out")).toHaveText("2,00");

  const resp = page.waitForResponse((r) => r.url().includes("/derivee/step"));
  await page.getByTestId("step-once").click();
  await resp;

  // w ← 1 − 2 · 0,6 · (1 − 5) = 1 + 4,8 = 5,8 — cohérent avec η réglé à 2.
  await expect.poll(async () => page.getByTestId("readout-w").textContent()).toBe("5,80");
  expect(errors).toHaveLength(0);
});

test("/derivee : « descendre tout seul » → le skieur ARRIVE dans la vallée", async ({ page }) => {
  const errors = collectDatastarErrors(page);
  await gotoAndSubscribe(page, "/derivee");

  await page.getByTestId("auto").click();

  // Boucle serveur : au PIRE 60 pas × ~250 ms ≈ 15 s ; à η=0,5 le seuil
  // |pente| < 0,005 est atteint en ~18 pas (≈ 4,5 s). Poll généreux.
  await expect(page.getByTestId("status")).toContainText("ARRIVÉ", { timeout: 25_000 });
  // La boucle s'est arrêtée : le bouton est revenu à l'état repos.
  await expect(page.getByTestId("auto")).toContainText("descendre tout seul");
  expect(errors).toHaveLength(0);
});

test("/derivee : « replacer » → retour au départ (w=1,00)", async ({ page }) => {
  const errors = collectDatastarErrors(page);
  await gotoAndSubscribe(page, "/derivee");

  // On bouge d'abord…
  const stepResp = page.waitForResponse((r) => r.url().includes("/derivee/step"));
  await page.getByTestId("step-once").click();
  await stepResp;
  await expect.poll(async () => page.getByTestId("readout-w").textContent()).toBe("2,20");

  // …puis on replace le skieur.
  const resetResp = page.waitForResponse((r) => r.url().includes("/derivee/reset"));
  await page.getByTestId("reset").click();
  await resetResp;
  await expect.poll(async () => page.getByTestId("readout-w").textContent()).toBe("1,00");
  await expect(page.getByTestId("status")).toHaveText("");
  expect(errors).toHaveLength(0);
});

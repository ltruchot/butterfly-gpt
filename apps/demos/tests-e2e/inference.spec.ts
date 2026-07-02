import { expect, test } from "@playwright/test";
import { collectDatastarErrors, gotoAndSubscribe } from "./_helpers.ts";

test.beforeEach(async ({ request }) => {
  await request.post("/inference/reset");
});

test("/inference : initial — Prêt, pas de nom encore", async ({ page }) => {
  const errors = collectDatastarErrors(page);
  await gotoAndSubscribe(page, "/inference");

  await expect(page.getByTestId("phase")).toContainText("Prêt");
  await expect(page.getByTestId("name")).toContainText("—");
  expect(errors).toHaveLength(0);
});

test("/inference : légende — BOS, softmax/température, autorégressif", async ({ page }) => {
  await gotoAndSubscribe(page, "/inference");
  const legend = page.getByTestId("legend");
  await expect(legend).toContainText("BOS");
  await expect(legend).toContainText("température");
  await expect(legend).toContainText("Autorégressif");
});

test("/inference : Générer → un nom apparaît (préparation puis génération)", async ({ page }) => {
  const errors = collectDatastarErrors(page);
  await gotoAndSubscribe(page, "/inference");

  await page.getByTestId("generate").click();

  // Au bout du compte, l'état passe à « Terminé » et un nom non vide est affiché.
  await expect(page.getByTestId("phase")).toContainText("Terminé", { timeout: 30_000 });
  const name = (await page.getByTestId("name").textContent())?.trim() ?? "";
  expect(name.length).toBeGreaterThan(0);
  expect(name).not.toBe("—");
  await expect(page.getByTestId("generate")).toBeEnabled();
  expect(errors).toHaveLength(0);
});

// Régression : « Générer » ne marchait qu'UNE fois (la garde runId, placée
// après la branche de préparation mémoïsée, tuait toute génération suivante,
// reset ou pas). Le scénario déterministe qui l'attrape : reset → « Prêt »,
// puis générer → avec le bug, la phase reste bloquée sur « Prêt » à jamais.
test("/inference : Générer marche PLUSIEURS fois, y compris après Reset", async ({ page }) => {
  const errors = collectDatastarErrors(page);
  await gotoAndSubscribe(page, "/inference");

  // 1re génération (inclut la préparation mémoïsée).
  await page.getByTestId("generate").click();
  await expect(page.getByTestId("phase")).toContainText("Terminé", { timeout: 30_000 });

  // 2e génération, après Reset : reset ramène à « Prêt », générer doit
  // repartir jusqu'à « Terminé » (rapide : le modèle est déjà entraîné).
  await page.getByTestId("reset").click();
  await expect(page.getByTestId("phase")).toContainText("Prêt");
  await expect(page.getByTestId("name")).toContainText("—");
  await page.getByTestId("generate").click();
  await expect(page.getByTestId("phase")).toContainText("Terminé", { timeout: 15_000 });
  const second = (await page.getByTestId("name").textContent())?.trim() ?? "";
  expect(second.length).toBeGreaterThan(0);
  expect(second).not.toBe("—");

  // 3e génération, SANS reset : re-générer directement depuis « Terminé »
  // doit aussi aboutir (le garde-fou déterministe du bug est le cas reset
  // ci-dessus ; ici on vérifie le chemin nominal du re-clic).
  await page.getByTestId("generate").click();
  await expect(page.getByTestId("phase")).toContainText("Terminé", { timeout: 15_000 });
  const third = (await page.getByTestId("name").textContent())?.trim() ?? "";
  expect(third.length).toBeGreaterThan(0);
  expect(third).not.toBe("—");

  expect(errors).toHaveLength(0);
});

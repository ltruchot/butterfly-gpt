import { expect, test } from "@playwright/test";
import { clickNext, collectDatastarErrors, gotoAndSubscribe } from "./_helpers.ts";

// Le serveur a un singleton in-memory : chaque test reset avant tout.
test.beforeEach(async ({ request }) => {
  await request.post("/autograd/reset");
});

test("initial render : 5 nœuds tous en `data ?` et `grad ?`", async ({ page }) => {
  const errors = collectDatastarErrors(page);
  await gotoAndSubscribe(page, "/autograd");

  const graph = page.getByTestId("graph");
  await expect(graph.locator("text")).toContainText([
    "data ?",
    "data ?",
    "data ?",
    "data ?",
    "data ?",
  ]);
  await expect(graph.locator("text")).toContainText([
    "grad ?",
    "grad ?",
    "grad ?",
    "grad ?",
    "grad ?",
  ]);
  await expect(page.getByTestId("phase")).toContainText("Prêt");

  // Légende focalisée AUTOGRAD — doc-as-test : la légende doit poser
  // (a) la distinction param vs input, (b) la fonction backward, (c) les
  // 3 champs Node (leaf/data/grad). Le pont « du texte aux nombres » a
  // migré vers /parameters (cf. parameters.spec.ts).
  const legend = page.getByTestId("legend");
  await expect(legend).toContainText("D'où viennent les nœuds-feuilles"); // intro
  await expect(legend).toContainText("paramètres du modèle"); // 1re source
  await expect(legend).toContainText("[a, z, u, r]"); // exemple d'input séquence
  await expect(legend).toContainText("backward(racine)"); // la fonction
  await expect(legend).toContainText("∂racine/∂feuille"); // formule de la dérivée
  await expect(legend).toContainText("data");
  await expect(legend).toContainText("grad");
  // Snapshot de la structure du graphe.
  const snapshot = page.getByTestId("legend-snapshot");
  await expect(snapshot).toContainText("const graph = {");
  await expect(snapshot).toContainText("Passe AVANT");
  await expect(snapshot).toContainText("Passe ARRIÈRE");
  await expect(snapshot).toContainText("parameter"); // les feuilles sont étiquetées
  // Titres des deux blocs graphes.
  const block1 = page.getByTestId("graph1-block");
  const block2 = page.getByTestId("graph2-block");
  await expect(block1).toContainText("Le mini-neurone");
  await expect(block2).toContainText("graphe complet");
  await expect(block2).toContainText("azur");
  // Graphe complet azur affiché statiquement.
  await expect(page.getByTestId("graph-azur").locator("svg")).toBeVisible();

  expect(errors).toHaveLength(0);
});

test("5 clics Next : passe avant — chaque nœud passe à sa data", async ({ page }) => {
  const errors = collectDatastarErrors(page);
  await gotoAndSubscribe(page, "/autograd");

  // 5 clics → 5 data révélées :
  //   tok_emb=2, pos_emb=-3, x=tok+pos=-1, w=-4, L=w·x=4.
  for (let i = 0; i < 5; i++) {
    await clickNext(page, "/autograd");
  }

  await expect
    .poll(async () => {
      const text = await page.getByTestId("graph").textContent();
      return (text ?? "").match(/data (-?\d+)/g)?.length ?? 0;
    })
    .toBe(5);

  const graph = page.getByTestId("graph");
  await expect(graph).toContainText("data 2");
  await expect(graph).toContainText("data -3");
  await expect(graph).toContainText("data -1");
  await expect(graph).toContainText("data -4");
  await expect(graph).toContainText("data 4");

  // Fin du forward → amorce du backward → grad 1 sur la racine L.
  await expect(graph).toContainText("grad 1");
  await expect(page.getByTestId("phase")).toContainText("Backward [0/4]");
  expect(errors).toHaveLength(0);
});

test("4 clics Next supplémentaires : passe arrière — tous les grads calculés", async ({ page }) => {
  const errors = collectDatastarErrors(page);
  await gotoAndSubscribe(page, "/autograd");

  // Forward + backward (9 clics total).
  for (let i = 0; i < 9; i++) {
    await clickNext(page, "/autograd");
  }

  const graph = page.getByTestId("graph");
  // ∂L/∂L = 1  (init)
  // ∂L/∂w = x = -1
  // ∂L/∂x = w = -4
  // ∂L/∂tok_emb = ∂L/∂x · 1 = -4
  // ∂L/∂pos_emb = ∂L/∂x · 1 = -4
  // Soit 1× "grad 1", 1× "grad -1", 3× "grad -4".
  await expect(graph).toContainText("grad 1");
  await expect(graph).toContainText("grad -1");
  await expect(graph).toContainText("grad -4");
  await expect(page.getByTestId("phase")).toContainText("Backward [4/4]");

  // Un clic de plus → done, bouton Next disabled.
  await clickNext(page, "/autograd");
  await expect(page.getByTestId("phase")).toContainText("Terminé");
  await expect(page.getByTestId("next")).toBeDisabled();
  expect(errors).toHaveLength(0);
});

test("Reset : retour à l'état initial après progression", async ({ page }) => {
  const errors = collectDatastarErrors(page);
  await gotoAndSubscribe(page, "/autograd");

  // Avance jusqu'à la fin
  for (let i = 0; i < 10; i++) await clickNext(page, "/autograd");
  await expect(page.getByTestId("phase")).toContainText("Terminé");

  await page.getByTestId("reset").click();

  // Attendre le morph qui ramène tous les nœuds à `data ?`.
  await expect
    .poll(async () => {
      const text = await page.getByTestId("graph").textContent();
      return (text ?? "").match(/data \?/g)?.length ?? 0;
    })
    .toBe(5);

  await expect(page.getByTestId("phase")).toContainText("Prêt");
  await expect(page.getByTestId("next")).not.toBeDisabled();
  expect(errors).toHaveLength(0);
});

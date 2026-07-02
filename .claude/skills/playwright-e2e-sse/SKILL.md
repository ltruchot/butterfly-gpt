---
name: Playwright E2E (Hono + SSE + Datastar)
description: Tests E2E pour apps Hono qui font du SSE + Datastar morph. Setup `webServer` Playwright + `vp dev`, attente du handshake SSE avant interaction, assertions sur le morph (poll + getByTestId), guard "zéro erreur Datastar runtime". Adapté du skill playwright-debug de gods-monorepo.
globs:
  - "apps/**/tests-e2e/**/*"
  - "apps/**/tests-e2e/playwright.config.ts"
---

# Playwright E2E — SSE & Datastar morph

> Tester une app Hono qui fait du SSE + morph Datastar exige quelques règles spécifiques. La principale : **toujours attendre la handshake SSE avant la première interaction**, sinon les clics partent avant que le client n'écoute les patches.

## Setup minimal

### Install

```bash
vp add -D @playwright/test
npx playwright install chromium    # ~120 MB, première fois seulement
```

### Layout du dossier tests

```
apps/<app>/
├── src/                            # le code Hono
├── public/                         # dont datastar.js
└── tests-e2e/
    ├── playwright.config.ts        # webServer + baseURL
    └── *.spec.ts
```

Ajouter au `package.json` :

```json
"scripts": {
  "test:e2e": "playwright test -c tests-e2e/playwright.config.ts",
  "test:e2e:headed": "playwright test -c tests-e2e/playwright.config.ts --headed"
}
```

> ⚠️ **Le `-c` est OBLIGATOIRE** : `playwright test` ne cherche la config que
> dans le **cwd**. Sans `-c`, la config de `tests-e2e/` (webServer, workers)
> n'est JAMAIS chargée — les specs tournent quand même et échouent tous en
> `ECONNREFUSED` à froid, mais passent si un dev server tourne déjà :
> le faux-vert parfait (vécu : 57/57 rouges découverts à l'audit 2026-07).

> ⚠️ **Jamais de `vp run` dans `webServer.command`** : Playwright le spawn au
> runtime SOUS la tâche `vp run test:e2e` → échec (marqueur d'env
> `VP_COMMAND`, cf. CLAUDE.md « Piège vp générique »). Un éventuel build
> préalable va dans le SCRIPT `test:e2e` (`vp run -F <pkg> build && playwright
test …` — là, Vite Task inline correctement) ; le webServer lance un binaire
> direct (`npx slidev --remote --port <n>`) ou `vp dev`, qui fonctionne, lui.

### `playwright.config.ts` — pattern monorepo

```ts
import { defineConfig, devices } from "@playwright/test";

const PORT = 11111; // ← cf. registre dans CLAUDE.md (Dev server convention)
const BASE = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: ".",
  timeout: 30_000,
  fullyParallel: false, // app a souvent un singleton in-memory → tests sériels
  retries: 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",

  use: {
    baseURL: BASE,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      // ⚠️ `use` du project ÉCRASE celui du root — re-passer baseURL.
      use: { ...devices["Desktop Chrome"], baseURL: BASE },
    },
  ],

  webServer: {
    command: "vp dev",
    cwd: "..", // se positionner sur le package de l'app
    url: BASE,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
```

**Points critiques** :

- `reuseExistingServer: !CI` : en dev local, on garde son propre `vp dev` ouvert ; Playwright le détecte et ne lance pas un nouveau. En CI, on veut un serveur dédié frais.
- `baseURL` doit être répété dans le `project.use` car celui-ci écrase le `use` racine (gotcha Playwright).
- `cwd: ".."` : par défaut Playwright se positionne dans `testDir` ; pour exécuter `vp dev`, il faut remonter au dossier du `package.json` de l'app.

---

## Pattern de test E2E pour SSE + morph

### Squelette

```ts
import { expect, type Page, test } from "@playwright/test";

const PORT = 11111;
const BASE = `http://localhost:${PORT}`;

// Guard zéro erreur runtime Datastar (KeyAndValueProvided, …).
const collectDatastarErrors = (page: Page): string[] => {
  const errs: string[] = [];
  page.on("console", (m) => m.type() === "error" && errs.push(m.text()));
  page.on("pageerror", (e) => errs.push(e.message));
  return errs;
};

// Attendre que le client OUVRE la SSE avant d'interagir.
const waitForSubscribe = (page: Page) =>
  page.waitForRequest((r) => r.url().includes("/subscribe"), { timeout: 5000 });

// État serveur in-memory partagé → reset au beforeEach.
test.beforeEach(async ({ request }) => {
  await request.post(`${BASE}/reset`);
});

test("scénario", async ({ page }) => {
  const errors = collectDatastarErrors(page);
  await page.goto(`${BASE}/`);
  await waitForSubscribe(page);

  await page.getByTestId("next").click();

  // Le morph est asynchrone (SSE round-trip) → polling.
  await expect
    .poll(async () => (await page.getByTestId("graph").textContent())?.includes("data 2") ?? false)
    .toBe(true);

  await expect(page.getByTestId("phase")).toContainText("Forward [1/5]");
  expect(errors).toHaveLength(0);
});
```

### Règles d'or

1. **`waitForSubscribe` AVANT toute interaction.** Sans ça, le premier `@post` peut partir avant que la SSE soit ouverte → le morph n'arrive jamais → le test boucle sur la valeur initiale jusqu'au timeout.
2. **`expect.poll` (ou `expect(locator).toContainText`) pour les assertions post-clic.** Pas de `waitForTimeout` arbitraire — fragile et lent.
3. **Tests sériels** (`fullyParallel: false`, `workers: 1`) si l'app a un singleton in-memory. Sinon les tests se marchent sur les pieds.
4. **`beforeEach` reset.** Toujours remettre l'état serveur à zéro entre tests, sinon l'ordre devient signifiant et un test cassé en gâte 3.
5. **Tester l'absence d'erreurs Datastar** explicitement à la fin de chaque test. Un `KeyAndValueProvided` planté en console laisse les `data-on:click` muets mais l'élément reste cliquable → on observe "rien se passe" sans signal clair.

### Anti-patterns

| Erreur                                    | Symptôme                                                 | Fix                                                                   |
| ----------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------- |
| `data-on-click` (avec hyphen) dans la JSX | Le clic ne déclenche rien, AUCUNE erreur dans la console | `data-on:click` (colon obligatoire)                                   |
| `page.goto("/")` sans baseURL effectif    | `Cannot navigate to invalid URL`                         | Soit fix `use.baseURL` dans project, soit URL absolue                 |
| `page.request.post("/reset")`             | `Invalid URL`                                            | URL absolue : `request.post(\`${BASE}/reset\`)`                       |
| Assertion sur `toBeInTheDocument` seule   | Test passe alors que Datastar parse a planté             | Combiner avec `getByTestId(...).textContent()` qui change après morph |
| Pas de `waitForSubscribe`                 | Premier clic timing-dépendant ; flaky 20-30%             | Toujours `await waitForSubscribe(page)` après `goto`                  |

---

## Débugger une session récalcitrante

### Lecture en direct des requêtes + console

```ts
test("debug", async ({ page }) => {
  page.on("request", (r) => console.log("[REQ]", r.method(), r.url()));
  page.on("response", (r) => console.log("[RES]", r.status(), r.url()));
  page.on("console", (m) => console.log(`[CON:${m.type()}]`, m.text()));
  page.on("pageerror", (e) => console.log("[ERR]", e.message));
  await page.goto(`${BASE}/`);
  await page.waitForTimeout(2000);
  // … interactions
});
```

Cherche dans la sortie :

- `[REQ] GET /subscribe?datastar=%7B%7D` → la SSE est ouverte
- `[REQ] POST /next` → le clic est wired
- `[RES] 200 .../next` → la commande est ACK
- `[RES] 500 .../next` → bug serveur : checker la sortie de `vp dev` (côté terminal)

### Headed mode

```bash
npx playwright test --headed --debug
```

Ouvre Chromium visible + l'inspecteur Playwright. Utile pour stepper.

### Screenshots intermédiaires

```ts
await page.screenshot({ path: "/tmp/step-0.png", fullPage: true });
```

Captures rapides pour reconstituer une story visuelle. À combiner avec `Read` du PNG dans Claude Code pour analyser le rendu.

---

## Erreurs Datastar à fail-fast côté test

Les classiques qui passent en silence si on n'attache pas un listener :

| Code                               | Quand                                                                             |
| ---------------------------------- | --------------------------------------------------------------------------------- |
| `KeyAndValueProvided`              | `data-bind:foo="$foo"` (key + value)                                              |
| `PatchElementsNoTargetsFound`      | Le serveur envoie un patch pour un id qui n'existe pas dans le DOM                |
| `SignalNotFound`                   | Référence à `$foo` dans une expression alors que le signal n'a jamais été déclaré |
| `Failed to load resource: ... 500` | Côté serveur : `Controller is already closed` (subscriber pas retiré)             |

Le `collectDatastarErrors` ci-dessus catch les trois premiers. Pour le 4e, écoute `console:error` ET regarde les `response` à status >= 400 :

```ts
page.on("response", (r) => {
  if (r.status() >= 400) console.log("[HTTP-ERR]", r.status(), r.url());
});
```

---

## Pièges spécifiques au monorepo (WSL/Cursor)

1. **Port stable obligatoire** : convention `host: true, port: 1111X, strictPort: true` dans `vite.config.ts`. Cf. skill `vp` (section IDE Integration) et `CLAUDE.md` du repo (Dev server convention). Sans ça, le port peut être remappé par Cursor → Playwright tape à côté.
2. **Stale dev server** : si une session précédente a planté, `lsof -i:11111` peut révéler un process zombie qui sert un vieux code. `pkill -f "vite|vp dev"` puis relancer. Symptôme typique : `POST /next` renvoie 500 alors que le code source est correct.
3. **Chromium dans WSL2** : binaire à `~/.cache/ms-playwright/chromium*/chrome-linux64/chrome`. Si `Browser executable not found` : `npx playwright install chromium`.

## Tests rapides en CLI

```bash
# Tout
vp run test:e2e

# Un seul fichier
npx playwright test autograd.spec.ts

# Avec filtre par nom de test
npx playwright test -g "Reset"

# Headed
npx playwright test --headed

# Reporter list (lisible) ou github (CI)
npx playwright test --reporter=line
```

## Scripts jetables de capture (hors suite Playwright)

Pour un screenshot ad-hoc (vérif visuelle d'une slide/page) :

- **`waitUntil: "networkidle"` ne se déclenche JAMAIS sur une page qui tient
  une SSE ouverte** (le réseau n'est jamais idle) → utiliser
  `"domcontentloaded"` + un `waitForTimeout` court.
- Le script doit vivre **dans le package** (pas `/tmp`) pour résoudre
  `@playwright/test` ; le supprimer après.
- Slide Slidev avec `v-click` : naviguer vers `/fr/<n>?clicks=99` (Slidev
  borne au max de la slide) — presser N fois `ArrowRight` finit par CHANGER
  de slide et capture la mauvaise page.

## Codebase landmark

`apps/demos/tests-e2e/` est l'exemple canonique dans ce monorepo : helpers partagés dans `_helpers.ts` (`gotoAndSubscribe`, `collectDatastarErrors`, `clickNext` anti-flake) + une spec par démo qui valide initial render, interactions (morph SSE reçu) et reset, avec le guard « zéro erreur console Datastar ». Tout test qui exerce une interaction câblée DOIT couvrir aussi le chemin « re-jouer » (2e clic, après reset) : un bug « ne marche qu'une fois » est invisible pour un test à un seul passage (vécu sur /inference).

## Sibling skills

- `datastar-cqrs` — comprendre ce que le serveur envoie (et l'ordre d'émission)
- `hono-typescript` — `app.request()` pour les tests unitaires (sans navigateur) en complément
- `vp` — port registry + commandes dev/test

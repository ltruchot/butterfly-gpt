import { defineConfig, devices } from "@playwright/test";

// ═══════════════════════════════════════════════════════════════════════════
// E2E du deck Slidev `butterfly-gpt` — filet de non-régression.
// ═══════════════════════════════════════════════════════════════════════════
// POURQUOI : on capture le comportement des widgets interactifs (curseurs, SVG
// réactifs) AVANT de remplacer les composants Vue par des web components. Les
// specs pilotent le VRAI deck (intégration Slidev réelle) et gardent « zéro
// erreur console » — ce qui attrape aussi un éventuel warning Vue
// « failed to resolve component » quand on passera aux tags <bgpt-*>.
//
// ⚠️ Ce deck est STATIQUE (pas de serveur SSE comme apps/demos) : pas de
// handshake `/subscribe` à attendre — juste naviguer vers une slide et agir.

const PORT = 11117; // cf. registre des ports (CLAUDE.md)
const BASE = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: ".",
  // Specs E2E en `.e2e.ts` (pas `.spec.ts`) : ainsi `vp test` (vitest, qui
  // ramasse `.test.ts`/`.spec.ts`) ne tente PAS de les exécuter — seul
  // `playwright test` les prend. TU purs = `.test.ts`, E2E = `.e2e.ts`.
  testMatch: "**/*.e2e.ts",
  timeout: 30_000,
  fullyParallel: false, // Slidev sert une SPA unique ; on reste sériel
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
      // `use` du project ÉCRASE le root → re-passer baseURL (gotcha Playwright).
      use: { ...devices["Desktop Chrome"], baseURL: BASE },
    },
  ],

  webServer: {
    // microgpt-ts doit être bâti (le deck l'importe) AVANT de lancer Slidev —
    // c'est le script `test:e2e` qui s'en charge (`vp run -F microgpt-ts build
    // && playwright test …`) : dans un script, Vite Task INLINE le `vp run`
    // imbriqué en vraie tâche. Ici en revanche, Playwright spawn la commande
    // comme un process enfant au runtime : un `vp run`/`vp build` imbriqué
    // sous la tâche `vp run test:e2e` échoue (même famille que le piège
    // « vp node dans une tâche » de CLAUDE.md) → slidev direct, sans vp.
    // Slidev est lent à démarrer (compile la 1re slide) → timeout généreux.
    command: "npx slidev --remote --port 11117",
    cwd: "..",
    url: BASE,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    stdout: "ignore",
    stderr: "pipe",
  },
});

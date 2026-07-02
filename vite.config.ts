import { defineConfig } from "vite-plus";

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  // Les decks Slidev sont exclus d'Oxfmt : leur markdown n'est PAS du markdown
  // standard (séparateurs de slides `---`, frontmatter `src:` par slide, MDC).
  // Oxfmt transforme les imports `src: ./pages/x.md` (entre deux `---`) en
  // titres setext `## src:` → casse tous les imports de pages. Slidev possède
  // le build de ces fichiers ; on les laisse hors du formateur.
  // Caches de poids générés (un JSON compact de milliers de nombres par modèle) :
  // hors formateur, sinon Oxfmt les « pretty-print » → un nombre par ligne, taille
  // multipliée. Ce sont des artefacts, pas des sources.
  fmt: { ignorePatterns: ["presentations/**/*.md", "**/by_seeds/**", "**/by_seeds_hard/**"] },
  lint: {
    // Fichiers de build Slidev exclus du lint ET du type-check : les imports
    // `.css` n'ont pas de .d.ts. Slidev possède le build de ces fichiers.
    ignorePatterns: ["presentations/**/styles/**"],
    options: { typeAware: true, typeCheck: true },
  },
  test: {
    // Les suites de tests-e2e/ sont du Playwright (`playwright test` via
    // `vp run test:e2e`), pas du Vitest : sans cette exclusion, `vp test` à la
    // racine ramasse les *.spec.ts d'apps/demos et sort en erreur.
    exclude: ["**/node_modules/**", "**/dist/**", "**/tests-e2e/**"],
  },
  run: {
    cache: true,
    tasks: {
      "butterflies:fetch": {
        command: "node scripts/butterflies-list-dataset-builder/fetch-butterflies.ts",
        cache: false,
      },
      "butterflies:enrich": {
        command: "node scripts/butterflies-list-dataset-builder/enrich-from-backbone.ts",
        cache: false,
      },
      "butterflies:clean": {
        command: "node scripts/butterflies-list-dataset-builder/clean-butterflies.ts",
        cache: false,
      },
      "butterflies:build-aligned": {
        command: "node scripts/butterflies-list-dataset-builder/build-aligned.ts",
        cache: false,
      },
      "butterflies:enrich-french": {
        command: "node scripts/butterflies-list-dataset-builder/enrich-french.ts",
        cache: false,
      },
      "butterflies:enrich-french-inat": {
        command: "node scripts/butterflies-list-dataset-builder/enrich-french-inat.ts",
        cache: false,
      },
      "butterflies:normalize": {
        command: "node scripts/butterflies-list-dataset-builder/normalize-butterflies.ts",
        cache: false,
      },
      butterflies: {
        command:
          "vp run butterflies:fetch && vp run butterflies:enrich && vp run butterflies:clean && vp run butterflies:build-aligned && vp run butterflies:enrich-french && vp run butterflies:enrich-french-inat && vp run butterflies:normalize",
        cache: false,
      },
    },
  },
});

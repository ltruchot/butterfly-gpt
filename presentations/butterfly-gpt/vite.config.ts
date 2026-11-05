// ═══════════════════════════════════════════════════════════════════════════
// Config Vite du deck — lue par Slidev (clé `slidev`) ET par `vp test`/`vp dev`.
// ═══════════════════════════════════════════════════════════════════════════
// POURQUOI : nos widgets sont désormais des web components vanilla <bgpt-*>, PAS
// des composants Vue. Sans réglage, le compilateur de templates de Vue tente de
// les résoudre comme composants → warning « Failed to resolve component » (et,
// en E2E, garde console rouge). On déclare donc à Vue que tout tag `bgpt-*` est
// un custom element natif.
//
// Slidev lit la clé `slidev` de ce fichier et la passe à son plugin Vue
// (cf. @slidev/cli : ViteSlidevPlugin(options, baseConfig.slidev) →
// vue.template.compilerOptions.isCustomElement). On reste sur un objet simple
// (pas de defineConfig) : `slidev` n'appartient pas au type Vite standard.
const config = {
  test: {
    // Vitest v4 compatibility: preserve mock call history.
    // Remove after tests no longer rely on calls from setup or earlier tests.
    // https://viteplus.dev/guide/vitest-v5#remove-unneeded-compatibility-settings
    // https://vitest.dev/guide/migration/#clearmocks-is-enabled-by-default
    clearMocks: false,
  },
  slidev: {
    vue: {
      template: {
        compilerOptions: {
          isCustomElement: (tag: string): boolean => tag.startsWith("bgpt-"),
        },
      },
    },
  },
};

export default config;

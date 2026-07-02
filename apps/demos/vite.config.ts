import devServer from "@hono/vite-dev-server";
import { defineConfig } from "vite-plus";

export default defineConfig({
  plugins: [
    devServer({
      entry: "src/index.tsx",
    }),
  ],
  server: {
    host: true,
    port: 11111,
    strictPort: true,
  },
  lint: {
    // Le bundle Datastar (public/datastar.js) est un asset minifié vendor
    // — pas du code source qu'on maintient. On l'exclut, ainsi que les
    // sorties de build et de tests E2E.
    ignorePatterns: ["public", "dist", "test-results", "playwright-report"],
    options: { typeAware: true, typeCheck: true },
  },
  fmt: {
    ignorePatterns: ["**/public/**", "**/dist/**", "public/datastar.js"],
  },
  test: {
    // Les specs de tests-e2e/ sont du Playwright, pas du Vitest : sans cette
    // exclusion, `vp test` les ramasse (motif *.spec.ts) et sort en erreur.
    exclude: ["**/node_modules/**", "**/dist/**", "tests-e2e/**"],
  },
  build: {
    target: "node22",
    outDir: "dist",
    lib: {
      entry: "src/index.tsx",
      formats: ["es"],
      fileName: "index",
    },
    rollupOptions: {
      external: [
        "hono",
        "hono/jsx",
        "hono/jsx/dom/server",
        "hono/html",
        "@hono/node-server",
        "@hono/node-server/serve-static",
        "@starfederation/datastar-sdk",
        "@starfederation/datastar-sdk/web",
        "microgpt-ts",
        "node:fs",
        "node:path",
        "node:url",
      ],
    },
  },
});

// Types ambiants pour `import.meta.env` injecté par Vite (équivalent minimal de
// `vite/client`, déclaré localement pour ne pas dépendre de sa résolution par le
// type-check du monorepo). Donne le type de `import.meta.env.BASE_URL` utilisé
// par lib/asset.ts.
interface ImportMetaEnv {
  readonly BASE_URL: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}

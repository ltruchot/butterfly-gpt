---
name: vp-local
description: Ce que Vite+ a de propre à ce monorepo, en complément de la skill partagée `vp` - les apps et leurs ports, les decks Slidev, le registre des ports, les pièges rencontrés ici. À charger avec `vp` avant de toucher package.json, vite.config.ts, pnpm-workspace.yaml, ou de lancer dev/build/test.
paths:
  - "**/package.json"
  - "**/vite.config.ts"
  - "pnpm-workspace.yaml"
---

# Vite+ dans ce monorepo

La skill `vp` porte ce qui est vrai de Vite+ partout ; elle est installée par `qol-mini` et
n'est jamais éditée ici. Ce fichier porte ce qui n'est vrai que de ce dépôt.

## Workspace

`pnpm-workspace.yaml` : `apps/*`, `packages/*`, `tools/*`. Les deps `workspace:*`
(ex. `"microgpt-ts": "workspace:*"`) sont résolues localement.

## Lancer les apps

| Package                                       | Commande                                                              | URL                             |
| --------------------------------------------- | --------------------------------------------------------------------- | ------------------------------- |
| `apps/demos` (multi-démos Hono+Datastar)      | `vp -C apps/demos dev`                                                | http://localhost:11111/autograd |
| `presentations/light-icons-showcase` (Slidev) | `vp run --filter @vp-monorepo-butterfly-gpt/light-icons-showcase dev` | http://localhost:11115          |
| `presentations/butterfly-gpt` (Slidev)        | `vp run --filter @vp-monorepo-butterfly-gpt/butterfly-gpt dev`        | http://localhost:11117          |

Les apps Vite/Hono passent par le builtin (`vp -C <dir> dev`, config `vite.config.ts`). Les
decks Slidev passent par `vp run --filter <pkg> dev` : le script `package.json` contient les
flags CLI Slidev requis (`--remote --port <n>`).

## Registre des ports

Le tableau qui fait foi est dans `CLAUDE.md`, section _Dev server convention_. À chaque
nouveau package, prendre le port libre suivant à partir de 11111 et l'ajouter au tableau dans
le même commit.

## Slidev : flags CLI uniquement

**Slidev IGNORE le bloc `server.*` de `vite.config.ts`**. Toujours passer par les flags :

```json
"dev": "slidev --remote --port 11115"
```

- `--remote` = bind `0.0.0.0`.
- `--port` = port stable (Slidev auto-incrémente sans).
- `--open` à éviter en WSL : tente de lancer un navigateur interne et meurt en `ENOEXEC`.
  Cliquer le lien affiché suffit.

## Diagnostic d'un port

```bash
ss -tlnp | grep <port>
# OK   : 0.0.0.0:<port>   <- joignable par le forwarder Cursor
# KO   : [::1]:<port>     <- host:true / --remote manquant
# KO   : un autre pid     <- dev server fantôme, kill <pid> puis relancer
```

## Pièges rencontrés ici

| Symptôme                                                                                                 | Cause                                                                                                                    | Remède                                                                                                                                                                                                                                 |
| -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `vp dev` ne démarre rien, sort instantanément                                                            | pas de `index.html` ni d'entry                                                                                           | une app **serveur** (Hono) a besoin de `@hono/vite-dev-server` qui pointe sur l'entry TS                                                                                                                                               |
| `vp test` plante sur un spec Playwright (`test.describe() not expected here`)                            | Vitest ramasse aussi les `*.spec.ts` E2E                                                                                 | nommer les E2E `*.e2e.ts` + `testMatch: "**/*.e2e.ts"`, ou exclure `**/tests-e2e/**`. L'exclusion doit être dans le `vite.config.ts` **racine** pour couvrir `vp test` lancé depuis la racine                                          |
| Un `vp run`/`vp build` lancé au runtime sous une tâche `vp run` échoue (exit 1 muet, ou mauvaise racine) | mesuré ici : l'enfant hérite du marqueur `VP_COMMAND` ; seul l'imbrication **dans un script** package.json est supportée | jamais de `vp run` dans un `webServer.command` Playwright : build dans le SCRIPT (`vp run -F <pkg> build && playwright test …`), binaire direct (`npx slidev …`) ou `vp dev` dans le webServer. Cf. `CLAUDE.md` « Piège vp générique » |
| Un deck Slidev a besoin d'options du compilateur Vue (ex. `isCustomElement`)                             | Slidev ignore `server.*` mais LIT le `vite.config.ts` du deck                                                            | sous la clé `slidev` : `export default { slidev: { vue: { template: { compilerOptions: { isCustomElement: t => t.startsWith('bgpt-') } } } } }`                                                                                        |

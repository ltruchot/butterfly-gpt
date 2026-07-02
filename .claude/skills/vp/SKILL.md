---
name: Vite+ (vp)
description: CLI unifié du monorepo. Toujours préférer `vp <commande>` à `pnpm/npm/yarn/bun` ou aux binaires Vite/Vitest directs — Vite+ embarque runtime, package manager et tooling (Vite 8 + Rolldown + Vitest + Oxlint + Oxfmt + tsgolint + Vite Task) derrière une seule porte d'entrée.
globs:
  - "package.json"
  - "vite.config.ts"
  - "pnpm-workspace.yaml"
---

# Vite+ — réflexes de base

Docs locales : `node_modules/vite-plus/docs/guide/`. En ligne : <https://viteplus.dev/guide/>.

## Règle #1 — TOUJOURS `vp <commande>`, jamais l'outil sous-jacent

Vite+ détecte le package manager du workspace (ici **pnpm** via `pnpm-workspace.yaml`) et délègue automatiquement. Utiliser directement `pnpm`, `vitest`, `vite`, `oxlint`, `tsc` est :

- moins ergonomique (vp normalise les flags),
- moins rapide (Vite Task cache les résultats),
- incohérent avec la configuration du monorepo (lockfile, registry, peer rules définis dans `pnpm-workspace.yaml`).

Si on a besoin d'un comportement bas-niveau spécifique au PM, le passe-plat existe : `vp pm <cmd>` — **mais c'est une allowlist** (prune, pack, list, view, publish, owner, cache, config, login, logout, whoami, token, audit, dist-tag, deprecate, search, rebuild, fund, ping). Pour les commandes hors-liste (typiquement `pnpm patch`/`patch-commit`), utiliser le pnpm embarqué de vp : `$HOME/.vite-plus/package_manager/pnpm/<version>/pnpm/bin/pnpm <cmd>`. La version dispo se voit avec `vp --version`.

## Commandes essentielles

| Tâche                           | Commande                                                        | Notes                                                                                                                  |
| ------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Installer les deps du workspace | `vp install`                                                    | Détecte pnpm, lit le lockfile. Pour le root explicitement : `vp install -w`.                                           |
| Ajouter une dep                 | `vp add <pkg>` (`-D` devDep, `-O` optional, `--save-peer` peer) | Met à jour `package.json` + lockfile.                                                                                  |
| Retirer une dep                 | `vp remove <pkg>`                                               | Idem.                                                                                                                  |
| Lancer le dev server            | `vp dev`                                                        | Vite dev server natif, HMR. Config dans `vite.config.ts` `server:` block.                                              |
| Build de prod                   | `vp build`                                                      | Rolldown + Vite 8. Output `dist/`. `--watch`, `--sourcemap` disponibles.                                               |
| Servir le build                 | `vp preview`                                                    | Après `vp build`.                                                                                                      |
| Lancer un script `package.json` | `vp run <script>` (alias `vpr`)                                 | **NE PAS** confondre avec `vp build` (qui est le builtin) — pour exécuter un script `"build"` custom : `vp run build`. |
| Format + lint + typecheck       | `vp check`                                                      | Oxfmt + Oxlint + tsgolint en parallèle. `--fix` pour auto-fix.                                                         |
| Tests unitaires                 | `vp test`                                                       | Vitest, single run par défaut. `vp test watch` pour le mode watch. `vp test run --coverage`.                           |
| Test d'un fichier précis        | `vp test tests/foo.test.ts`                                     | Path positional.                                                                                                       |

## Workspace (monorepo)

```bash
# Cible un package par nom (via le script "build" du package.json)
vp run @my/app#build
vp run --filter @my/app build

# Récursif sur tous les packages (ordre des deps)
vp run -r build

# Transitif : un package + ses dépendances
vp run -t @my/app#build

# Parallèle (ignore l'ordre des deps)
vp run -r --parallel dev
```

> ⚠️ **`--filter`/`-F` n'existe QUE sur `vp run`**, pas sur les builtins (`vp dev`, `vp build`, `vp test`…). Pour cibler un package avec un builtin, passer le **chemin positionnel** : `vp dev apps/demos`. Erreur typique : `vp -F demos dev` → `Unexpected argument '-F'`.

Dans ce monorepo (`pnpm-workspace.yaml`) : `apps/*`, `packages/*`, `tools/*`. Les deps `workspace:*` (ex. `"microgpt-ts": "workspace:*"`) sont résolues localement.

### Lancer les apps de ce monorepo

| Package                                       | Commande                                                              | URL                             |
| --------------------------------------------- | --------------------------------------------------------------------- | ------------------------------- |
| `apps/demos` (multi-démos Hono+Datastar)      | `vp dev apps/demos`                                                   | http://localhost:11111/autograd |
| `presentations/light-icons-showcase` (Slidev) | `vp run --filter @vp-monorepo-butterfly-gpt/light-icons-showcase dev` | http://localhost:11115          |
| `presentations/butterfly-gpt` (Slidev)        | `vp run --filter @vp-monorepo-butterfly-gpt/butterfly-gpt dev`        | http://localhost:11117          |

Les apps Vite/Hono passent par le builtin `vp dev <chemin>` (config `vite.config.ts`). Les decks Slidev doivent passer par `vp run --filter <pkg> dev` car le script `package.json` contient les flags CLI Slidev requis (`--remote --port <n>`) — Slidev ignore `server.*` de `vite.config.ts`.

Tableau autoritatif des ports : `CLAUDE.md` (section _Dev server convention_).

## Dev server — bonne pratique Cursor/VS Code + WSL

**Règle d'or** : un app = un port unique stable, bindé sur toutes les interfaces (`0.0.0.0`), `strictPort: true`. Sans ça, Cursor/VS Code en WSL :

1. Ne peut pas forward un binding `[::1]` (IPv6 loopback) → ctrl-click sur l'URL du terminal ouvre un port remappé qui répond "connection refused".
2. Auto-increment silencieux sur collision si `strictPort` absent → l'URL affichée ne correspond pas au port forwardé.

### Vite apps — `vite.config.ts`

```ts
import { defineConfig } from "vite";

export default defineConfig({
  server: {
    host: true, // bind 0.0.0.0, pas [::1]
    port: 11111, // unique par app (registre dans CLAUDE.md)
    strictPort: true, // fail loud, jamais d'auto-increment
  },
});
```

### Slidev decks — flags CLI uniquement

**Slidev IGNORE le bloc `server.*` de `vite.config.ts`**. Toujours passer par les flags :

```json
"dev": "slidev --remote --port 11115"
```

- `--remote` = bind `0.0.0.0` (`--bind` y default à `0.0.0.0`).
- `--port` = port stable (Slidev auto-incrémente sans).
- `--open` à éviter en WSL : tente de spawn un browser interne, dies en `ENOEXEC`. Cliquer le lien affiché suffit (Cursor/VS Code gère le forward).

### Registre des ports

Le tableau autoritatif est dans `CLAUDE.md` du repo, section _Dev server convention_. À chaque nouveau package, prendre le port libre suivant à partir de 11111 et l'ajouter au tableau dans le même commit.

### Diagnostic rapide

```bash
ss -tlnp | grep <port>
# OK   : 0.0.0.0:<port>   <- joignable par le forwarder Cursor
# KO   : [::1]:<port>     <- host:true / --remote manquant
# KO   : un autre pid     <- dev server fantôme, kill <pid> puis relancer
```

## Configuration — tout dans `vite.config.ts`

**Une seule source de vérité** pour Vite, Vitest, Oxlint, Oxfmt, tasks :

```ts
import { defineConfig } from "vite-plus";

export default defineConfig({
  plugins: [
    /* Vite plugins */
  ],
  server: { port: 5173, strictPort: true },
  build: {
    /* options */
  },
  test: { include: ["tests/**/*.test.ts"] }, // Vitest config
  lint: { options: { typeAware: true, typeCheck: true } },
  fmt: {},
  run: {
    tasks: {
      /* Vite Task */
    },
  },
});
```

**À éviter** : `vitest.config.ts`, `.oxlintrc.json`, fichiers de config séparés — la doc le déconseille explicitement (« we do not recommend using `vitest.config.ts` with Vite+ »).

## Caching `vp run`

Les scripts `package.json` ne sont PAS cachés par défaut. Pour activer :

```bash
vp run --cache build
```

Ou définir une `tasks` dans `vite.config.ts` (cachées par défaut, supportent `dependsOn`, `env`, …).

## Pièges classiques

| Symptôme                                                                                                                               | Cause                                                                                                                                  | Remède                                                                                                                                                                                                                                                                                                                                   |
| -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `vp dev` ne démarre rien, sort instantanément                                                                                          | Pas de `index.html` ni `vite.config.ts` avec `entry`                                                                                   | Pour une app **serveur** (Hono, Express…) il faut un plugin du type `@hono/vite-dev-server` qui pointe sur ton entry TS.                                                                                                                                                                                                                 |
| `vp run build` exécute le builtin au lieu de mon script                                                                                | `vp build` (sans `run`) lance toujours le build Vite natif                                                                             | Pour le script `"build"` du `package.json` : utiliser `vp run build` (ou `vpr build`).                                                                                                                                                                                                                                                   |
| `vp test` ne stoppe pas                                                                                                                | Mode watch par accident                                                                                                                | Sans flag, `vp test` fait un run unique. Pour watch : `vp test watch`.                                                                                                                                                                                                                                                                   |
| Conflit lockfile en CI                                                                                                                 | Manque de `--frozen-lockfile`                                                                                                          | `vp install --frozen-lockfile` en CI.                                                                                                                                                                                                                                                                                                    |
| Tests "vite-plus/test" introuvables                                                                                                    | Mauvais import                                                                                                                         | Importer `expect`/`test` depuis `"vite-plus/test"` (alias normalisé), pas `"vitest"` directement.                                                                                                                                                                                                                                        |
| `vp test` plante sur un spec Playwright (`test.describe() not expected here`)                                                          | `vp test` (Vitest) auto-découvre `**/*.{test,spec}.ts` → il ramasse AUSSI les `*.spec.ts` E2E Playwright                               | Nommer les E2E `*.e2e.ts` + `testMatch: "**/*.e2e.ts"` (le deck fait ça), OU exclure : `test: { exclude: [..., "**/tests-e2e/**"] }`. ⚠️ L'exclusion doit être dans le `vite.config.ts` **RACINE** pour couvrir `vp test` lancé depuis la racine (l'exclusion par-package n'y suffit pas — vécu à l'audit 2026-07 : 12 fichiers rouges). |
| Un `vp run`/`vp build` **spawné au runtime** sous une tâche `vp run` échoue (exit 1 muet, ou `vp build` qui résout la mauvaise racine) | L'enfant hérite du marqueur d'env `VP_COMMAND` du task-runner ; seul le nesting **dans un script** package.json est inliné et supporté | Jamais de `vp run` dans un `webServer.command` Playwright (ni tout autre spawn runtime) : build dans le SCRIPT (`vp run -F <pkg> build && playwright test …`), binaire direct (`npx slidev …`) ou `vp dev` (qui, lui, marche imbriqué) dans le webServer. Cf. CLAUDE.md « Piège vp générique ».                                          |
| Un deck **Slidev** a besoin d'options du compilateur Vue (ex. `isCustomElement` pour des web components)                               | Slidev ignore `server.*` mais LIT un `vite.config.ts` de deck                                                                          | Mettre les options sous la clé `slidev` : `export default { slidev: { vue: { template: { compilerOptions: { isCustomElement: t => t.startsWith('bgpt-') } } } } }` (vérifié dans `@slidev/cli` : `ViteSlidevPlugin(opts, config.slidev)`).                                                                                               |

## Checklist d'arrivée sur le repo

```bash
vp install                            # installer / sync deps
vp check                              # format + lint + types passent ?
vp test                               # tests unitaires passent ?
vp run --filter <pkg> dev             # lancer l'app cible
```

## IDE Integration (VS Code)

Quand `vp create` ou `vp migrate` scaffoldent un projet, ils écrivent `.vscode/extensions.json` + `.vscode/settings.json`. Si on bootstrap manuellement, ajouter :

**`.vscode/extensions.json`**

```json
{
  "recommendations": ["VoidZero.vite-plus-extension-pack"]
}
```

Le pack contient deux extensions clés :

- **Oxc** — format + lint en direct via `vp check`
- **Vitest** — runs unitaires via `vp test`

**`.vscode/settings.json`**

```json
{
  "editor.defaultFormatter": "oxc.oxc-vscode",
  "[javascript]": { "editor.defaultFormatter": "oxc.oxc-vscode" },
  "[javascriptreact]": { "editor.defaultFormatter": "oxc.oxc-vscode" },
  "[typescript]": { "editor.defaultFormatter": "oxc.oxc-vscode" },
  "[typescriptreact]": { "editor.defaultFormatter": "oxc.oxc-vscode" },
  "oxc.fmt.configPath": "./vite.config.ts",
  "editor.formatOnSave": true,
  "editor.formatOnSaveMode": "file",
  "editor.codeActionsOnSave": { "source.fixAll.oxc": "explicit" },
  "npm.scriptRunner": "vp"
}
```

Notes critiques :

- Les blocs `[language]` sont **obligatoires** : VS Code donne la priorité aux settings user-level `[language]` sur le workspace `editor.defaultFormatter`. Sans eux, un Prettier global re-prend la main silencieusement.
- `formatOnSaveMode: "file"` est requis car Oxfmt ne supporte **pas** le formatage partiel.
- `oxc.fmt.configPath` pointe vers `vite.config.ts` (single source of truth — voir section Configuration ci-dessus).
- `"npm.scriptRunner": "vp"` fait que le panel NPM Scripts de VS Code passe par `vp` (donc bénéficie du cache + workspace awareness). `vp create` l'ajoute, `vp migrate` ne le fait pas (compat équipe).

Zed : voir `node_modules/vite-plus/docs/guide/ide-integration.md` — section similaire.

## Pour aller plus loin

Liste complète des guides dispo localement :

```
node_modules/vite-plus/docs/guide/
├── install.md   add.md     remove.md
├── dev.md       build.md   preview.md
├── check.md     lint.md    fmt.md
├── test.md      run.md     cache.md
├── pack.md      create.md  migrate.md   upgrade.md
├── ci.md        commit-hooks.md         ide-integration.md
├── env.md       vpx.md     why.md       troubleshooting.md
└── implode.md
```

Cible quand un cas tordu apparaît : `troubleshooting.md` d'abord, puis le guide spécifique de la commande.

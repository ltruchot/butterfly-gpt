<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

<!--VITE PLUS END-->

## Règles de travail

- Répondre dans la **langue de l'utilisateur** (français ici). **Commentaires
  de code et docs en français** — spécificité pédagogique de ce repo (public
  débutant / collégien).
- **Concis, technique, sans verbiage** ; mais **expliquer les choix
  d'architecture** quand on en fait un.
- **Pas de gros diff d'un coup** : préférer de petits incréments lisibles,
  faciles à relire et à valider.
- **No overengineering. Aucune dépendance runtime nouvelle sans justification
  explicite** — le tronc `packages/microgpt-ts` est « zéro dépendance runtime »,
  c'est un invariant, pas un accident.
- **Challenger les hypothèses fausses de l'utilisateur. Zéro hallucination** :
  si on n'est pas sûr d'une API `vp` / Datastar / Slidev / Hono, on **vérifie**
  (docs locales `node_modules/vite-plus/docs`, skills, fichier source) plutôt
  que d'inventer une signature plausible.

## Projet — microgpt-ts (le « GPT papillon »)

Ce monorepo réimplémente le **microgpt** d'Andrej Karpathy
(https://karpathy.github.io/2026/02/12/microgpt/, gist
`8627fe009c40f57531cb18360106ce95`) en **TypeScript fonctionnel et
ultra-pédagogique**. Public visé : **développeur débutant / collégien de 3e**,
peu de bagage mathématique. Fil thématique unique : **les noms de papillons**
(`data/butterflies/*.refined.txt`).

### Règle de fidélité (IMPORTANT)

On **colle à 100% au déroulé de l'article** (sections : Dataset · Tokenizer ·
Autograd · Parameters · **Architecture** · Training loop · Inference · Run it) —
rien de plus, rien de moins. Sous « Architecture » vivent embeddings, attention,
MLP, résiduels : **aucun n'est mis en avant** (langage neutre, pas de « la phare »).
**On n'invente PAS de renommages** : c'est l'utilisateur qui les décide et les
dicte, pour qu'on puisse lire le code 1:1 à côté de l'original. Renommages actés :
`Value→Node` ; `wte/wpe/lm_head → tokenEmb/positionEmb/outputProj`. Le reste suit
les identifiants de Karpathy (`attn_wq/wk/wv/wo`, `mlp_fc1/mlp_fc2`, `gpt()`, …).

### Le diptyque : pour chaque section de microgpt, on produit 2 choses

1. **Un fichier TS numéroté** dans `packages/microgpt-ts/src/` — FP pur,
   immuable (`readonly`), **zéro dépendance runtime**, commentaires français
   qui expliquent le _pourquoi_ (intuition, importance en ML) **avant** le
   _quoi_. En-têtes `// ═══`, citations `microgpt.py:<ligne>` pour la
   traçabilité. Un test Vitest par fichier (`tests/0X-*.test.ts`,
   `import { expect, test } from "vite-plus/test"`, noms FR).
2. **Une démo interactive** dans `apps/demos/` (Hono + Datastar SSE, CQRS
   strict ; un dossier par concept : `session.ts`/`commands.ts`/`queries.ts`/
   `renderApp.tsx`/`<x>.tsx`). E2E Playwright dans `tests-e2e/`. Cf. skills
   `datastar-cqrs`, `hono-typescript`, `playwright-e2e-sse`.

Quand une section repose sur une notion de maths nouvelle, un **interlude
math** narratif (même pattern CQRS, texte long + figure SVG serveur) est
intercalé dans `apps/demos` juste AVANT la démo qui s'en sert, avec un
symbole à la place d'un numéro dans le stepper : `/derivee` (∂, avant
autograd), `/produit-scalaire` (a·b, avant attention), `/logarithme` (ln,
avant loss). L'ancienne app `apps/math` a été fusionnée là-dedans puis
supprimée — `apps/demos` est le cours magistral autosuffisant.

### Sections (état au 2026-06-01)

`01-dataset` · `02-tokenizer` · `03-autograd` · `04-parameters` ·
`05-embeddings` · `06-rmsnorm` · `07-attention` (dot, linear, softmax,
multi-tête) · `08-mlp` · `09-model` (initModel, gpt) · `10-loss`
(cross-entropy) · `11-adam` · `12-train` · `13-sample`.

- **Tronc TS + runner** : FAIT et testé (123 tests verts).
- **Démos `apps/demos`** : FAIT pour tout — dataset, tokenizer, autograd,
  parameters, embeddings, rmsnorm, attention, mlp, forward, loss, training
  (courbe de loss live SSE), inference (génération live) + les 3 interludes
  math (∂ dérivée/skieur, a·b produit scalaire, ln logarithme). Suite e2e :
  68 verts (apps/demos) + 20 (deck butterfly-gpt).

> ⚠️ `backward` (03) a une version **rapide autonome** (O(nœuds+arcs)) utilisée
> par l'entraînement ; `backwardSteps` (générateur, clone la Map par arc) est
> réservé à la **visualisation pas-à-pas** des démos — ne PAS l'utiliser pour
> entraîner (quadratique).

### Une seule commande (comme `python microgpt.py`)

```
vp run train          # entraîne sur les papillons (~1 min, 1000 pas) puis génère ~20 noms
```

Le runner est `packages/microgpt-ts/src/microgpt.ts`, lancé par le script
`train` (= `node src/microgpt.ts` ; Node 24 exécute le TS et les imports `.ts`
nativement — **`vp node` échoue dans une tâche `vp run`**, utiliser `node`).

> ⚠️ **Piège vp générique (famille du précédent)** : un `vp run`/`vp build`
> spawné **au runtime comme process enfant** d'une tâche `vp run` échoue
> (l'enfant hérite du marqueur d'env `VP_COMMAND` du task-runner et se croit
> dans la tâche ; `vp build` peut même résoudre la MAUVAISE racine de projet).
> Un `vp run` imbriqué **dans un script** package.json est, lui, inliné par
> Vite Task et fonctionne (documenté). Conséquences pratiques : jamais de
> `vp run` dans un `webServer.command` Playwright (mettre le build dans le
> script `test:e2e`, et un binaire direct — `npx slidev …` — dans le
> webServer) ; `vp dev` imbriqué fonctionne, lui.

On peut passer la graine en argument : `vp run infer 42`. Autres réglages via
env : `MICROGPT_STEPS`, `MICROGPT_SAMPLES`, `MICROGPT_TEMPERATURE`,
`MICROGPT_SEED`. Le runner entraîne sur le **corpus complet** (5 904 noms,
comme microgpt.py), et le vocabulaire `uchars` est construit sur ce corpus
complet (44 tokens : espace, a–z, accents, tiret, apostrophe `’`, + BOS). Les
poids entraînés sont mis en cache par (graine, durée) dans
`packages/microgpt-ts/by_seeds/<seed>-<steps>.json` (rechargés au lieu de ré-entraîner ;
dossier versionné dans git).
Hyperparamètres Karpathy : `nEmbd=16 nHead=4 nLayer=1`,
`lr=0.01` (décroissance linéaire), Adam `β1=0.85 β2=0.99 eps=1e-8`, `std=0.08`,
`temperature=0.5`. **Seule adaptation au dataset** : `blockSize=64` (Karpathy :
16, taillé pour des prénoms courts ; nos noms de papillons vont jusqu'à 42
caractères, donc 16 tronquerait la moitié du corpus). Repère : la loss part de ~`ln(vocabSize)` (~3,8) et descend
vers ~2,4.

## Règle d'or — toujours lint + test avant de dire "c'est fait"

**Jamais** annoncer qu'une modification est terminée sans avoir exécuté, en plus des étapes de la Review Checklist ci-dessus :

1. `vp check` — passe à 0 erreur (les warnings préexistants hors scope sont tolérés, mais à mentionner).
2. `vp test` — sur le(s) package(s) touché(s), tous les tests passent.

Si le code passe au type-check mais qu'une URL/route/asset ne pointe plus au bon endroit après un rename/refactor, on n'a **rien validé**. Démarrer le dev server concerné (`vp dev <chemin>`) et vérifier que l'app rend sans 404 ni erreur console fait partie du critère "fait" pour toute modif qui touche au runtime (routes, imports d'assets statiques, chemins publics, etc.).

> Cette règle prime sur la concision : préférer un message un peu plus long avec la trace de `vp check` / `vp test` à un "✅ fait" qui se révèle faux.

## Règles qualité agents (adaptées à notre stack)

Garde-fous comportementaux qui font la différence sur la qualité. Ils
renforcent — sans les dupliquer — la « Règle de fidélité » et la « Règle d'or »
ci-dessus.

### Quality gate — règle dure « ne jamais contourner »

`vp check` (format / lint / types) et `vp test` sont **la** barrière qualité.

- ❌ JAMAIS `git commit --no-verify` ni `--no-gpg-sign` pour sauter un hook.
- ❌ JAMAIS désactiver / éditer une règle de lint juste pour faire passer un
  commit.
- Si la gate bloque → **le code est faux : on corrige le code, pas la gate.**
  Assouplir une règle est une **décision de l'utilisateur**, qui atterrit dans
  son propre commit motivé.

### Philosophie micro-itération

- Chaque tâche = **plus petit livrable** qui compile, lint et passe les tests.
- `vp check && vp test` après **chaque** itération, pas seulement à la fin.
  Si c'est rouge, on corrige avant de continuer.
- Une **suite verte EST la définition de « fait »**. Jamais « satisfait » avec
  du rouge.
- Préférer **plusieurs petits commits** (chacun = état qui marche) à un
  big-bang.

### Charger les skills avant chaque tâche (LOAD SKILLS)

Avant d'implémenter, charger les skills pertinents au domaine touché :

- **Toujours** : `vp` (CLI unifié — jamais `pnpm/npm/yarn` ni binaires directs).
- Si on touche `apps/demos` (routes / SSE / Datastar) : `datastar-cqrs` +
  `hono-typescript`.
- Si on touche les E2E (`tests-e2e/`) : `playwright-e2e-sse`.

Cycle de tâche : **LOAD SKILLS → IMPLÉMENTER → VÉRIFIER (`vp check && vp test`)
→ COMMIT atomique.**

### Avant d'écrire du frontend — pas d'hallucination SPA, lire l'existant

- `apps/demos` = **Hono SSR + Datastar (`data-*`) + SSE**, CQRS strict. Ce
  **N'EST PAS** React / Vue / SPA. Si on se surprend à écrire `useState`,
  `useEffect`, `addEventListener`, du routing client ou un fetch-puis-render →
  **STOP, on hallucine** : relire le skill `datastar-cqrs`.
- **Lire le fichier existant d'abord** et comprendre les patterns en place
  (`session.ts` / `commands.ts` / `queries.ts` / `renderApp.tsx`) avant
  d'ajouter.
- **Réutiliser** un composant / une démo existants avant d'en créer un parallèle.

### Règle « false green » pour les tests E2E

- Un `getByTestId(...).toBeInTheDocument()` qui passe **pendant que le runtime
  Datastar jette** (`SignalNotFound`, `PatchElementsNoTargetsFound`,
  `KeyAndValueProvided`…) est un **faux vert** : les nœuds DOM existent que les
  attributs aient parsé ou non.
- Tout test E2E d'une démo interactive doit **exercer l'interaction câblée**
  (le morph SSE est bien reçu, le signal a changé) **ET asserter zéro erreur
  console Datastar** (guard du skill `playwright-e2e-sse`). Présence DOM seule =
  nécessaire mais **pas** suffisant.

### Factorisation LEGO — extraire le réutilisable (slides + démos + CSS)

Principe LEGO : deux seules opérations légitimes — **réutiliser** un élément
existant tel quel, ou **en ajouter un** explicitement. Jamais réinventer un
one-off parallèle quand un équivalent existe.

- **Slides** : ce qui se répète dans `presentations/butterfly-gpt` se
  **factorise** en composant / élément de charte, puis est **démontré hors
  contexte** dans `presentations/matrix-comics-showcase` — le deck
  **référence / vitrine** (rôle équivalent à un Storybook), posé sur la base
  `presentations/light-icons-showcase`. Rappel : `butterfly-gpt` est la
  **source de vérité** du design system ; toute évolution de la charte y naît,
  puis est **rétro-portée** dans `matrix-comics-showcase` (la vitrine ne
  démontre que ce qui, par redondance, est devenu un élément du système —
  pas les widgets one-off).
- **`apps/demos`** : même logique — ce qui est réutilisable est
  **extrait** (helper, module, composant — cf. `src/views/`) plutôt que
  copié-collé entre démos.
- **CSS** : la feuille de style fait au maximum du **style simple sur les
  balises** (donc omniprésent) ; on repose au max sur le **socle HTML/CSS/JS
  baseline 2026 + Datastar**, pas sur des couches d'abstraction.
- **Composition HTML qui revient** → on en fait un « composant » refacto. **Ce
  n'est PAS React** : à la place un **web component vanilla**, ou même un simple
  **ensemble de classes CSS (BEM)** facile à réimplémenter ensuite.

## Lancer les apps

`vp dev` prend un **chemin** positionnel (pas de flag workspace `-F` ni `--filter` — ils ne sont reconnus que par `vp run`). Slidev nécessite ses propres flags CLI, donc on passe par le script `dev` du `package.json` via `vp run --filter`.

| Package                                  | Commande de lancement (depuis la racine)                                | URL                                       |
| ---------------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------- |
| `apps/demos` (multi-démos Hono+Datastar) | `vp run demos` (= `vp dev apps/demos`)                                  | http://localhost:11111/autograd           |
| `presentations/light-icons-showcase`     | `vp run --filter @vp-monorepo-butterfly-gpt/light-icons-showcase dev`   | http://localhost:11115                    |
| `presentations/butterfly-gpt` (bilingue) | `vp run --filter @vp-monorepo-butterfly-gpt/butterfly-gpt dev`          | http://localhost:11117 (`/fr/1`, `/en/1`) |
| `presentations/matrix-comics-showcase`   | `vp run --filter @vp-monorepo-butterfly-gpt/matrix-comics-showcase dev` | http://localhost:11119                    |

Équivalent local : `cd <chemin> && vp dev` (ou `pnpm dev` via le script).

## Présentations (slides Slidev) — source de vérité

- **La présentation OFFICIELLE** du projet est `presentations/butterfly-gpt`
  (titre « Karpathy's MicroGPT »). C'est le SEUL deck de contenu à faire évoluer.
  **Lancement en une commande** : `vp run slides` (= `vp run -F microgpt-ts
build && vp run -F @vp-monorepo-butterfly-gpt/butterfly-gpt dev` — le build de
  microgpt-ts d'abord, car le deck importe le package buildé ; script racine ; raccourci
  `vpr slides`) → http://localhost:11117. NB : `vp slides` tout court n'existe
  pas — vp n'exécute les scripts que via `vp run`/`vpr`.
- **Deck BILINGUE FR/EN (i18n maison)** : un seul deck, langue commutable. Le
  wording vit dans `i18n/fr.ts` + `i18n/en.ts` (mêmes clés, parité garantie par
  le type `Dict`) ; `i18n/dict.ts` = helpers (`resolve`/`domLang`/`locale`),
  `i18n/lang.ts` = ref réactive + event `bgpt:langchange`. Helper global `$t` posé
  par `setup/main.ts`. **Routing miroir** via `setup/routes.ts` (`/:lang(fr|en)/:no`)
  - un `afterEach` qui ré-injecte le préfixe → `/fr/12`, `/en/12` ; URL nue → FR.
    Sélecteur de langue sur la cover (`components/LangSwitch.vue`). Anciennes pages
    EN (deck `butterfly-gpt-en`) supprimées — tout est dans le deck unique.
    Conventions i18n d'une page : texte simple `{{ $t('page.cle') }}` ; bloc HTML
    riche `v-html="$t(...)"` ; libellé de SFX traduit `<bgpt-sfx text-key="page.cle">`
    ; alt d'image `:alt="$t(...)"`. Dans un bloc **`v-pre` Datastar** (où `$t` Vue ne
    passe pas), libellé STATIQUE via `data-text="window.bgpt.t('page.cle')"`. **Le
    CODE affiché (fences, commentaires, internes de démos) est TOUJOURS en anglais**,
    dans les deux langues (décision actée). `vue` est déclaré au catalog (résolution
    de types des `.ts` du deck ; même instance que Slidev).
- **Sa charte graphique** est documentée par `presentations/matrix-comics-showcase`
  (thème « Matrix en mode comics » : flat / BD, palette pétrole-crimson-ambre,
  encre + crème, contours encrés, titres **Anton**, SFX **Bangers**). Depuis la
  réconciliation 2026-07, **la source de vérité est `butterfly-gpt`** : la couche
  charte (`styles/charte.css` + `styles/fonts.css` + `setup/shiki.ts` +
  `layouts/` `cover`/`image-bg`/`image-blur` + web components
  `src/components/` `bgpt-sfx`/`bgpt-plate` + `lib/asset.ts`) est **dupliquée à
  l'identique** dans les deux decks, deltas légitimes documentés en tête de
  fichier (la vitrine n'a ni i18n/`LangSwitch`, ni la branche `text-key` du SFX).
  Modifier la charte = la faire évoluer dans `butterfly-gpt` PUIS la rétro-porter
  dans `matrix-comics-showcase`. Les anciens composants Vue (`ComicPanel`/`Sfx`/
  `Plate`) et `uno.config.ts` ont été supprimés ; seul `Swatch.vue` (dispositif
  documentaire de la palette) reste propre à la vitrine.
- **Exemples de template Slidev** (layouts du thème de base `light-icons` :
  `center-image`, `image-left/right`, `dynamic-image`, `image-header-intro`,
  composants `LightIcon`/`IconBox`) : voir `presentations/light-icons-showcase`
  — mais **toujours en se conformant à la charte** `matrix-comics-showcase`.
- ⚠️ Import de pages dans un `slides.md` : `src:` en **frontmatter**
  (`---\nsrc: ./pages/x.md\n---`), JAMAIS `## src:` (rend un titre littéral).
- ⚠️ Image dans une slide : passer par le composant `<Plate src="/x.jpg" />`
  (ou un `:src` dynamique), jamais `<img src="/x.jpg">` brut (Vite tente un
  import statique hors `fs.allow` → erreur).

## Dev server convention (Cursor/VS Code + WSL)

Every app must bind on **all interfaces** with a **stable, unique port** so Cursor/VS Code can forward it cleanly through WSL. Without this the editor either remaps to an unreachable IPv4 port or auto-increments on port collision and the printed URL is wrong.

**Vite apps** — `vite.config.ts`:

```ts
import { defineConfig } from "vite";

export default defineConfig({
  server: {
    host: true,           // bind 0.0.0.0 (not [::1] only)
    port: <unique>,       // see port registry below
    strictPort: true,     // fail loud on conflict, never auto-increment
  },
});
```

**Slidev decks** — CLI flags only (Slidev IGNORES `server.*` in `vite.config.ts`):

```json
"dev": "slidev --remote --port <unique>"
```

`--remote` is the Slidev flag that binds on `0.0.0.0` (the `--bind` default).

### Port registry (start at 11111, increment per package)

| Package                                | Port  |
| -------------------------------------- | ----- |
| `apps/demos`                           | 11111 |
| `presentations/light-icons-showcase`   | 11115 |
| `presentations/butterfly-gpt`          | 11117 |
| `presentations/matrix-comics-showcase` | 11119 |

> `11113` est LIBRE depuis la fusion d'`apps/math` dans `apps/demos` ;
> `11118` est LIBRE depuis la fusion FR/EN (deck `butterfly-gpt-en` supprimé).

> **Ports exclus par Windows/Hyper-V sur cette machine** : `11112` et `11116`. Le kernel Linux renvoie `EADDRINUSE` alors que `ss` ne montre aucun listener — symptôme typique d'une réservation Hyper-V. Vérifier la disponibilité d'un port avec : `node -e "require('net').createServer().listen(<port>,'0.0.0.0',function(){this.close()}).on('error',e=>console.log(e.code))"`.

When you add a new app/deck, pick the **next free port** in sequence and add it to this table in the same commit.

### Troubleshooting

- **Clicked terminal URL opens a different port / "connection refused"** — Slidev/Vite is bound on `[::1]` (IPv6 loopback) only. Confirm with `ss -tlnp | grep <port>`; the local address should be `0.0.0.0:<port>`, not `[::1]:<port>`. If it isn't, your `host: true` / `--remote` is missing.
- **Port auto-incremented to N+1 / N+2** — a stale dev server from a previous crashed run is still bound. `ss -tlnp | grep <port>` to find the pid, `kill <pid>`, restart.

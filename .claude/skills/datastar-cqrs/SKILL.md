---
name: Datastar CQRS (TypeScript / Hono)
description: Datastar v1.0.1 côté navigateur + Hono côté serveur. Architecture CQRS stricte : POST = command (ACK 200, jamais de patch), GET /subscribe = SSE long-lived qui pousse TOUS les morphs. Adapté d'une version Go templ pour ce monorepo TS. Lire avant de toucher à un attribut data-*, une route SSE, ou un fat-morph.
paths:
  - 'apps/**/src/**/*.{ts,tsx}'
  - 'apps/**/public/datastar.js'
---

# Datastar + CQRS, à la sauce TypeScript / Hono

> L'API Datastar elle-même (attributs, modificateurs, options des actions, événements SSE, morph) est dans la skill partagée `datastar`, installée par `qol-mini` et jamais éditée ici. Ce fichier porte l'architecture de ce dépôt : CQRS strict, fat morph, Hono.

> Fork conceptuel d'un skill `datastar-sse` écrit pour Go templ + NATS, retaillé pour : Node.js + Hono + JSX serveur (`hono/jsx`), pas de templ Go, pas de NATS. Utilise le SDK officiel [`@starfederation/datastar-sdk`](https://github.com/starfederation/datastar-typescript). Le bundle client (`datastar.js` v1.0.1) est servi statiquement depuis `public/`.

## ⚠️ Landmines récurrentes — LIRE AVANT TOUT

**1. `data-on-load` n'existe pas.** Silencieusement ignoré.

- Pour ouvrir une SSE à l'arrivée : `data-init="@get('/subscribe')"`.
- Tous les `data-on:*` utilisent **deux-points** : `data-on:click`, jamais `data-on-click` (qui ne fait RIEN).

**2. Ne JAMAIS retourner un patch SSE dans le body d'un POST.**
La règle d'or CQRS : `POST /command` renvoie un ACK 200 vide ; les patches **passent exclusivement** par le canal `/subscribe` déjà ouvert. C'est ce qui rend le pattern composable (re-render multi-clients, replay, undo, etc.).

```ts
// ❌ NE PAS faire — patch dans le body POST
app.post("/next", (c) => {
  return c.html("<main>...</main>"); // morph ad-hoc, anti-CQRS
});

// ✅ CQRS — ACK + broadcast via SSE
app.post("/next", (c) => {
  advance();
  broadcast(renderApp(getSnapshot())); // pousse à TOUS les /subscribe ouverts
  return c.body(null, 200);
});
```

**3. `data-bind` : forme-clé OU forme-valeur, jamais les deux.**

- ✅ `<input data-bind:email />` (auto-crée `$email`)
- ✅ `<input data-bind="email" />` (forme-valeur : le nom nu, sans `$`)
- ❌ `<input data-bind:email="$email" />` → `KeyAndValueProvided`, parse abort, casse tous les `data-*` voisins.

**4. Stable `id` sur chaque élément morphable.** Idiomorph matche par `id` ; sans id, l'élément est recréé → focus perdu, listeners droppés.

**5. `data-preserve-attr` pour garder les handlers à travers un morph.**

- Sur le composant fat-morphé : `data-preserve-attr="data-init"` (pour conserver l'abonnement SSE).
- Sur les boutons morphés : tu n'as PAS besoin si leur `data-on:click` est ré-émis à chaque rendu (idiomorph regarde l'attribut sortant).

**6. Modificateur à durée (`__debounce.150ms`) en JSX : le point est ILLÉGAL dans un nom d'attribut.** Ce n'est pas oxfmt qui est pointilleux — la grammaire TSX elle-même rejette `data-on:input__debounce.150ms=…` (TS1003/TS1351, vérifié). L'échappatoire canonique de JSX est le spread à clé littérale :

```tsx
<input
  type="range"
  data-bind:eta=""
  {...{ "data-on:input__debounce.150ms": "@post('/derivee/eta')" }}
/>
```

(Au passage : `data-bind:eta=""`, pas `data-bind:eta={true}` qui sérialiserait `="true"` → landmine n° 3.)

**7. Le contrôleur SSE doit `unsubscribe` à l'abort, sinon `Controller is already closed`.**

```ts
ServerSentEventGenerator.stream(
  (stream) => {
    const sub = { patch: (html) => stream.patchElements(html) };
    unsubscribe = subscribers.add(sub);
    sub.patch(initialHtml);
  },
  {
    keepalive: true,
    onAbort: () => unsubscribe(),
    onError: () => unsubscribe(),
  },
);
```

**Toujours** wrap le `broadcast()` dans un try/catch qui retire le subscriber qui crashe — race condition garantie sinon.

---

## Le Tao (5 principes condensés)

1. **Backend = source de vérité.** La vue est une projection du state serveur.
2. **Patching, pas remplacement.** Idiomorph préserve listeners + focus + transitions CSS.
3. **CQRS par construction.** Lectures = SSE long-lived. Écritures = POST/PUT/PATCH/DELETE courts.
4. **Signal minimalism.** Les `$signals` sont pour interactions UI / form bindings — **pas** pour dupliquer l'état serveur (qui vit dans la mémoire/DB/queue).
5. **Une seule SSE par page.** Tous les morphs d'une page transitent par le même flux, dans l'ordre d'émission serveur.

Docs : <https://data-star.dev/guide/the_tao_of_datastar>.

---

## Architecture d'une feature CQRS en Hono / TS

```
Browser
 ├─ data-init="@get('/subscribe')"     ouvre SSE long-lived
 ├─ data-on:click="@post('/next')"     command (ACK 200)
 └─ datastar.js (Pro v1.0.1)           parse data-*, gère SSE, morph

Hono server
 ├─ GET  /                             SSR initial (JSX serveur) + <BaseLayout>
 ├─ GET  /subscribe                    SSE long-lived, push initial + on-change
 ├─ POST /command                      muté state + broadcast → ACK 200 vide
 └─ static                             serve public/datastar.js

State (in-memory ou KV)
 └─ Set<Subscriber> + méthodes domain.
    Broadcast appelle subscriber.patch(html) pour CHAQUE subscriber.
```

L'exemple complet vit dans `apps/demos/src/autograd/` : `session.ts`, `{commands,queries}.ts`, `autograd.tsx`, `renderApp.tsx`. Layout partagé : `apps/demos/src/views/layout.tsx`.

---

## Attributs Datastar — ceux qu'on utilise vraiment

| Attribut             | Usage                                                         |
| -------------------- | ------------------------------------------------------------- |
| `data-on:click`      | `data-on:click="@post('/next')"`                              |
| `data-on:input`      | `data-on:input__debounce.500ms="@get('/search')"`             |
| `data-on:submit`     | `data-on:submit__prevent="@post('/save')"`                    |
| `data-init`          | Action à l'arrivée du nœud — typiquement `@get('/subscribe')` |
| `data-bind:foo`      | Two-way binding form ↔ `$foo`                                 |
| `data-text`          | `data-text="$count"`                                          |
| `data-show`          | `data-show="$visible"`                                        |
| `data-class:x`       | `data-class:active="$isActive"`                               |
| `data-attr:disabled` | `data-attr:disabled="$loading"`                               |
| `data-signals`       | `data-signals="{count: 0}"` / `data-signals:foo="42"`         |
| `data-preserve-attr` | Liste d'attributs à conserver pendant un morph                |
| `data-ignore-morph`  | Ne pas toucher cet élément pendant les morphs                 |

Modifiers communs sur `data-on:*` : `__debounce.500ms`, `__throttle.100ms`, `__once`, `__prevent`, `__stop`, `__window`, `__outside`.

Doc : <https://data-star.dev/reference/attributes>.

---

## Actions HTTP — `@get/@post/@put/@patch/@delete`

Toutes les actions envoient automatiquement **tous les signaux non-souligné** : dans le body JSON pour `@post/@put/@patch`, dans le paramètre de query `datastar` pour `@get` et `@delete`. Ne JAMAIS passer le payload à la main.

```html
<!-- ❌ payload manuel -->
<button data-on:click="@post('/submit', {email: $email})">…</button>
<!-- ✅ le serveur lit les signaux dans le body -->
<button data-on:click="@post('/submit')">…</button>
<!-- Filtrer (ne pas tout envoyer) -->
<button data-on:click="@post('/save', {filterSignals: {include: /^name|^email$/}})">…</button>
```

Options utiles : `filterSignals`, `headers`, `openWhenHidden`, `retry`, `requestCancellation`. Doc : <https://data-star.dev/reference/actions>.

Côté serveur, on lit les signaux depuis le body :

```ts
import { ServerSentEventGenerator } from "@starfederation/datastar-sdk/web";

app.post("/submit", async (c) => {
  const result = await ServerSentEventGenerator.readSignals(c.req.raw);
  if (!result.success) return c.body(result.error, 400);
  // result.signals = { name: "…", email: "…", … }
});
```

---

## SSE — wire format officiel

Deux événements, et seulement deux. Le SDK les émet, mais il faut connaître la forme pour debug réseau.

```
event: datastar-patch-elements
data: elements <main id="app">…morphé in place…</main>

event: datastar-patch-signals
data: signals {"count": 42, "user": {"name": "Alice"}}
```

Il n'y a pas d'événement `datastar-execute-script` en v1 : `executeScript` du SDK envoie un `datastar-patch-elements` qui ajoute un `<script>` à `body`.

Tous les événements **terminent par deux \n** — le SDK s'en occupe.

API SDK (`@starfederation/datastar-sdk/web` — runtime Web Standards, idéal Hono) :

```ts
stream.patchElements(html, { selector?, mode? });
stream.patchSignals(jsonString, { onlyIfMissing? });
stream.executeScript(code);
stream.removeElements(selectorOrIds);
stream.removeSignals(paths);
```

Doc : <https://data-star.dev/reference/sse_events>.

---

## Pattern « fat morph » — un seul container, tout patché à chaque step

Pour une page entière qui se ré-écrit (ex: state machine pédagogique, jeu, dashboard), c'est OK et même **recommandé** de patcher un `<main id="app">` complet à chaque event.

```tsx
// views/page.tsx
export const App: FC<{ state: SessionSnapshot }> = ({ state }) => (
  <main id="app" data-init="@get('/subscribe')" data-preserve-attr="data-init">
    {/* tout le contenu */}
  </main>
);
```

Idiomorph regarde par `id`, descend récursivement et conserve focus + listeners là où c'est possible. Si un sous-élément a une animation longue (3D, transition) qui ne doit pas être interrompue par un morph, l'isoler avec un autre `id` et le patcher séparément (ou `data-ignore-morph` localement).

Anti-pattern : générer N petits patches séparés pour un même event si tout l'UI dépend de l'event. Préférer un seul morph racine — atomique, ordre garanti, ré-entrant.

---

## CQRS à l'échelle d'un état partagé multi-client

Si plusieurs clients regardent la même page, le pattern reste identique :

```ts
const subscribers = new Set<Subscriber>();

export const subscribe = (s: Subscriber) => {
  subscribers.add(s);
  return () => subscribers.delete(s);
};

export const broadcast = (html: string) => {
  for (const s of [...subscribers]) {
    try {
      s.patch(html);
    } catch {
      subscribers.delete(s);
    }
  }
};
```

Pour des sessions par-client (auth) : utiliser un `Map<sessionId, Set<Subscriber>>` et router `broadcast(sessionId, html)`.

Pour un state distribué (multi-process, scale-out) : remplacer le `Set` par un canal Redis pub/sub / NATS / fan-out worker. **Sans changer l'API client.**

---

## Antipatterns à fuir

| Anti-pattern                                                       | Bon pattern                                                     |
| ------------------------------------------------------------------ | --------------------------------------------------------------- |
| `c.html(<App />)` dans une route POST                              | Renvoyer 200 vide ; pousser via SSE                             |
| `<button data-on-click=…>` (hyphen)                                | `data-on:click=…` (colon)                                       |
| `data-bind:foo="$foo"`                                             | `data-bind:foo` OU `data-bind="foo"` (pas les deux)             |
| Pas d'`id` sur élément morphé                                      | `id` stable ; sans `id`, idiomorph recrée                       |
| Subscriber jamais retiré sur abort                                 | `onAbort` + `onError` qui `unsubscribe()`                       |
| `subscribers.forEach(s => s.patch(…))` qui plante au 1er flux mort | `for…of` + `try/catch` + `subscribers.delete(s)`                |
| `console.log` partout en prod sur les patches                      | Buffer les broadcasts (debounce) si fréquence > 60Hz            |
| Un signal par valeur d'UI dupliquée du serveur                     | Un signal = une intention/un binding ; le reste vient via morph |
| Réimporter datastar dans chaque page                               | Un seul `<script src="/datastar.js">` dans `<BaseLayout>`       |

---

## Codebase landmarks (vp-monorepo-butterfly-gpt)

- **App de démo** : `apps/demos/` (chaque démo vit sous son dossier `src/<demo>/` et est exposée sous le préfixe d'URL `/<demo>`). Exemple `autograd`, monté sur `/autograd` :
  - `src/index.tsx` — Hono entry, monte les sous-routeurs : `app.route("/autograd", autogradCommands)` etc.
  - `src/views/layout.tsx` — `<BaseLayout>` partagé entre démos avec `<script src="/datastar.js">`
  - `src/views/IconsSprite.tsx` — sprite SVG partagé (icônes)
  - `src/autograd/autograd.tsx` — `<App>` fat-morph cible (id="app", data-init pointe `/autograd/subscribe`, data-preserve-attr)
  - `src/autograd/queries.ts` — `GET /autograd/subscribe` (SSE long-lived avec onAbort/onError)
  - `src/autograd/commands.ts` — `POST /autograd/next`, `POST /autograd/reset` (ACK 200 + broadcast)
  - `src/autograd/session.ts` — singleton in-memory + `subscribe`/`broadcast`
  - `src/autograd/renderApp.tsx` — `renderToString(<App state={…} />)`
  - `public/datastar.js` — bundle Pro v1.0.1 servi statiquement à la racine, partagé entre démos

- **Asset Datastar** : `public/datastar.js` (113 KB, IIFE, écoute auto les `data-*`).

## Sibling skills

- `hono-typescript` — routing, JSX, streamSSE, testing
- `playwright-e2e-sse` — E2E avec attente SSE, morph, console errors
- `vp` — CLI du monorepo

## Sources officielles

- Guide : <https://data-star.dev/guide/getting_started>, <https://data-star.dev/guide/reactive_signals>, <https://data-star.dev/guide/the_tao_of_datastar>
- Reference : <https://data-star.dev/reference/attributes>, <https://data-star.dev/reference/actions>, <https://data-star.dev/reference/sse_events>
- SDK TS : <https://github.com/starfederation/datastar-typescript>
- Bundle Pro : <https://data-star.dev/pro>

---
name: Hono (TypeScript)
description: Hono v4.x — Web framework basé sur les Web Standards qui tourne partout (Node, Bun, Deno, Workers). Stack utilisée dans ce monorepo via @hono/node-server + @hono/vite-dev-server, JSX serveur (hono/jsx), streamSSE natif et helpers pour TYPE-safe routes.
globs:
  - "apps/**/src/**/*.{ts,tsx}"
  - "apps/**/vite.config.ts"
---

# Hono — réflexes pour ce monorepo

> Hono est un framework HTTP ultra-léger basé sur les **Web Standards** (Request/Response du Fetch API). Zéro dépendance en prod. Tourne nativement sur Node.js (via `@hono/node-server`), Bun, Deno, Cloudflare Workers, etc.
>
> Docs : <https://hono.dev>. `llms-small.txt` est le résumé ML-friendly. `llms-full.txt` pour la doc complète.

## Versions épinglées (vérifier au moment de l'install)

- `hono` — catalogué (voir `pnpm-workspace.yaml`, actuellement `^4.9.8`), tiré via `"hono": "catalog:"` dans `apps/demos/package.json`
- `@hono/node-server` ^1.19
- `@hono/vite-dev-server` ^0.21 (dev HMR via Vite)
- Node >= 22

## Setup minimal en monorepo Vite+

**`tsconfig.json`** (pour JSX serveur) :

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "hono/jsx",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "module": "esnext",
    "target": "es2023"
  }
}
```

**`vite.config.ts`** :

```ts
import devServer from "@hono/vite-dev-server";
import { defineConfig } from "vite-plus";

export default defineConfig({
  plugins: [devServer({ entry: "src/index.tsx" })],
  server: { port: 5173, strictPort: true },
});
```

**`src/index.tsx`** (entry, exporté `default app`) :

```tsx
import { Hono } from "hono";
const app = new Hono();
app.get("/", (c) => c.text("Hello"));
export default app; // @hono/vite-dev-server lit ce default
```

`vp dev` lance Vite avec le plugin → Hono est servi sur :5173 avec HMR.

## Routing

```ts
import { Hono } from "hono";
const app = new Hono();

app.get("/posts/:id", (c) => {
  const id = c.req.param("id");
  const page = c.req.query("page"); // string | undefined
  return c.text(`Post ${id}, page ${page}`);
});

app.post("/posts", async (c) => {
  const body = await c.req.json(); // typé `unknown`
  return c.json({ ok: true, body }, 201);
});

app.delete("/posts/:id", (c) => c.body(null, 204)); // 204 No Content

// Composer plusieurs sous-routeurs (parfait pour CQRS)
app.route("/", commandsRouter);
app.route("/", queriesRouter);
```

`c.req.raw` est la `Request` Fetch API native — utile quand un SDK attend `Request` directement (ex: `ServerSentEventGenerator.readSignals(c.req.raw)`).

## Réponses — `c.json`, `c.html`, `c.text`, `c.body`

```ts
c.text("hello")                       // text/plain
c.text("created", 201)                // status code en 2e arg
c.json({ ok: true })                  // application/json
c.html(<App />)                       // text/html, accepte JSX directement
c.body(null, 200)                     // body vide — parfait pour ACK CQRS
c.redirect("/login", 302)
c.body(stream, 200, { "Content-Type": "text/event-stream" }) // streaming raw
```

## JSX serveur (`hono/jsx`)

Le JSX est résolu côté serveur — pas de runtime client, pas de bundle. Tout est string HTML.

```tsx
import type { FC, PropsWithChildren } from "hono/jsx";
import { raw } from "hono/html"; // injecter du HTML brut sans échapper

type LayoutProps = PropsWithChildren<{ title: string }>;
export const Layout: FC<LayoutProps> = ({ title, children }) => (
  <>
    {raw("<!DOCTYPE html>")}
    <html>
      <head>
        <title>{title}</title>
      </head>
      <body>{children}</body>
    </html>
  </>
);

app.get("/", (c) => c.html(<Layout title="Hi">Body</Layout>));
```

**Rendre en string** (pour l'envoyer dans une SSE par exemple) :

```ts
import { renderToString } from "hono/jsx/dom/server";
const html: string = renderToString(<App state={…} />);
stream.patchElements(html);
```

**Important** : un fichier qui contient du JSX **doit** être `.tsx`. Sinon, le bundler le traite comme du TS pur.

## Streaming SSE

Deux options :

### A. Hono natif (`hono/streaming`)

```ts
import { streamSSE } from "hono/streaming";

app.get("/sse", (c) =>
  streamSSE(c, async (stream) => {
    let i = 0;
    while (!stream.aborted) {
      await stream.writeSSE({ data: `tick ${i++}`, event: "tick", id: String(i) });
      await stream.sleep(1000);
    }
  }),
);
```

### B. SDK Datastar (`@starfederation/datastar-sdk/web`)

Préférable dès qu'on travaille avec Datastar — abstrait le wire format et expose `patchElements` / `patchSignals` / `executeScript`.

```ts
import { ServerSentEventGenerator } from "@starfederation/datastar-sdk/web";

app.get("/subscribe", () =>
  ServerSentEventGenerator.stream(
    (stream) => {
      stream.patchElements("<main id='app'>…</main>");
    },
    {
      keepalive: true,
      onAbort: () => {
        /* cleanup */
      },
    },
  ),
);
```

Voir skill `datastar-cqrs` pour le pattern complet pub/sub.

## Static files (Node adapter)

```ts
import { serveStatic } from "@hono/node-server/serve-static";
app.use("/static/*", serveStatic({ root: "./public" }));
// ou path explicite par fichier :
app.use("/datastar.js", serveStatic({ path: "./public/datastar.js" }));
```

⚠️ `serveStatic` de `@hono/node-server` ≠ celui de `hono/cloudflare-workers` ≠ celui de `hono/deno`. Vérifier le bon import par runtime.

## Middleware

```ts
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";

app.use(logger());
app.use("/api/*", cors({ origin: "*" }));
app.use(secureHeaders());
```

Middleware custom (typé) :

```ts
type Variables = { userId: string };
const app = new Hono<{ Variables: Variables }>();

app.use(async (c, next) => {
  const id = c.req.header("x-user");
  if (!id) return c.body(null, 401);
  c.set("userId", id);
  await next();
});

app.get("/me", (c) => c.text(c.get("userId"))); // typé string
```

## Tests unitaires — `app.request()`

Pas besoin de serveur HTTP. `app.request(url, init)` crée une `Request` et invoque `app.fetch` directement → `Response`.

```ts
import { expect, test } from "vite-plus/test";
import app from "../src/index.tsx";

test("GET / returns 200", async () => {
  const res = await app.request("/");
  expect(res.status).toBe(200);
  expect(await res.text()).toContain("<main");
});

test("POST /next returns 200 empty body", async () => {
  const res = await app.request("/next", { method: "POST" });
  expect(res.status).toBe(200);
  expect((await res.text()).length).toBe(0);
});
```

Pour les tests E2E qui ont besoin d'un vrai navigateur (SSE + Datastar morph), voir skill `playwright-e2e-sse`.

## Production : `@hono/node-server`

```ts
import { serve } from "@hono/node-server";
import app from "./index.tsx";

if (import.meta.url === `file://${process.argv[1]}`) {
  serve({ fetch: app.fetch, port: 3000 }, ({ port }) => console.log(`Listening on ${port}`));
}
```

En dev, **inutile** : `@hono/vite-dev-server` plug Hono directement dans Vite. Le code de prod (`serve()`) ne s'exécute que lorsque le module est lancé directement par Node.

## Pièges récurrents

| Symptôme                                                          | Cause                                                     | Fix                                                                                         |
| ----------------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `Cannot read JSX in .ts`                                          | mauvais extension                                         | renommer en `.tsx`                                                                          |
| `c.req.json()` retourne `undefined`                               | content-type pas `application/json`                       | client doit envoyer JSON, ou utiliser `c.req.text()` puis `JSON.parse`                      |
| 404 sur `/static/foo`                                             | mauvais `serveStatic` (Workers vs Node)                   | importer depuis `@hono/node-server/serve-static`                                            |
| `app.request("/")` rate baseURL                                   | URL relative pas autorisée pour `Request`                 | toujours passer un path absolu (`/`) — pas d'`http://localhost`                             |
| Type error sur `c.get()`                                          | `Variables` pas déclaré dans `new Hono<{Variables: …}>()` | ajouter le generic                                                                          |
| SSE plante avec `ERR_INVALID_STATE: Controller is already closed` | subscriber pas retiré à l'abort                           | passer `onAbort`/`onError` dans `stream` options + `try/catch` autour de chaque `patch()`   |
| `c.html(<App />)` retourne `[object Object]`                      | composant async pas attendu                               | hono/jsx résout synchroneusement, mais si tu utilises `Suspense` → `renderToReadableStream` |

## Commandes (via `vp`)

```bash
vp install                          # installer deps
vp dev                              # dev server HMR (port 5173)
vp build                            # build prod (Rolldown)
vp test                             # vitest unit tests
vp check                            # format + lint + types
```

Voir skill `vp` pour le détail. Pour des E2E (vrai navigateur) : skill `playwright-e2e-sse`.

## Codebase landmark

`apps/demos/src/index.tsx` est l'exemple canonique du pattern (Hono + JSX + serveStatic + montage de sous-routeurs par démo sous un préfixe d'URL, ex. `/autograd`) dans ce monorepo.

## Sources

- Site : <https://hono.dev>
- `llms.txt` (index) : <https://hono.dev/llms.txt>
- `llms-small.txt` (résumé ML-friendly) : <https://hono.dev/llms-small.txt>
- `llms-full.txt` (doc complète) : <https://hono.dev/llms-full.txt>
- Repo : <https://github.com/honojs/hono>
- JSX guide : <https://hono.dev/docs/guides/jsx>
- Testing guide : <https://hono.dev/docs/guides/testing>

## Sibling skills

- `datastar-cqrs` — la couche front + le pattern CQRS bout-à-bout
- `playwright-e2e-sse` — tester l'app dans un vrai navigateur (SSE + morph)
- `vp` — CLI du monorepo

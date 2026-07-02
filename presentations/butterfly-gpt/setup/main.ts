// Expose un helper GLOBAL `$asset` à tous les templates — y compris les pages
// markdown, où l'on ne peut pas importer de fonction. Usage dans une page :
//   <img :src="$asset('/klowd-boss-math-2.png')" />
// Les composants/layouts, eux, importent `withBase` directement (cf. lib/asset).
//
// On N'IMPORTE NI `defineAppSetup` de `@slidev/types` NI `App` de `vue` (non
// résolus par le type-check du monorepo pour les fichiers setup, cf. shiki.ts) :
// Slidev appelle simplement l'export default avec le contexte ({ app, … }).
// D'où le type structurel minimal ci-dessous.
import { registerComponents } from "../src/components/index.ts";
import { registerI18n } from "../i18n/index.ts";
import { getLang, setLang, storedLang } from "../i18n/lang.ts";
import { withBase } from "../lib/asset.js";

// Enregistre nos web components <bgpt-*> côté client (idempotent, no-op en SSR).
registerComponents();

// Typage structurel minimal du routeur (on n'importe pas vue-router ici, cf.
// la note sur les types non résolus pour les fichiers setup).
type RouteLike = { params: Record<string, string | string[] | undefined> };
type RouterLike = {
  beforeEach: (g: (to: RouteLike) => void) => void;
  afterEach: (g: (to: RouteLike) => void) => void;
  replace: (to: string) => unknown;
};

const isLang = (v: unknown): v is "fr" | "en" => v === "fr" || v === "en";

export default ({
  app,
  router,
}: {
  app: { config: { globalProperties: Record<string, unknown> } };
  router: RouterLike;
}) => {
  app.config.globalProperties.$asset = withBase;
  registerI18n(app);

  // 1) URL → état : le segment /fr|/en fixe la langue courante.
  router.beforeEach((to) => {
    if (isLang(to.params.lang)) setLang(to.params.lang);
  });

  // 2) Persistance du préfixe : la nav interne Slidev pousse `/:no` SANS langue
  //    → on ré-injecte `/<lang>/<no>` pour que l'URL reste miroir (ex. /fr/13).
  //    Garde-fou anti-boucle : ne rien faire si déjà préfixé.
  router.afterEach((to) => {
    const no = to.params.no;
    if (!isLang(to.params.lang) && typeof no === "string" && /^\d+$/.test(no)) {
      const l = storedLang() ?? getLang();
      router.replace(`/${l}/${no}`);
    }
  });
};

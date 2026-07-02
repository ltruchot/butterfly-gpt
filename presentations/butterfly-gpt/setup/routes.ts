// ═══════════════════════════════════════════════════════════════════════════
// Routes i18n : ajoute un segment de langue /fr|/en devant le numéro de slide.
// ═══════════════════════════════════════════════════════════════════════════
// Slidev expose un point d'extension des routes : le client termine sa
// construction par `setups.reduce((routes, setup) => setup(routes), routes)` sur
// `#slidev/setups/routes` — c.-à-d. l'export default de CE fichier. On reçoit la
// liste de routes déjà bâtie et on la renvoie modifiée.
//
// La route normale est `/:no` (composant play.vue). On en clone une variante
// `/:lang(fr|en)/:no` (même composant) pour servir /fr/12 et /en/12, + un
// redirect /fr → /fr/1. La PERSISTANCE du préfixe pendant la navigation interne
// (Slidev pousse `/:no` nu) est assurée par le `afterEach` de setup/main.ts.
//
// On n'importe pas les types vue-router (non résolus pour les fichiers setup du
// monorepo, cf. main.ts) : typage structurel minimal.
type Route = {
  path: string;
  name?: string | symbol;
  component?: unknown;
  redirect?: unknown;
};

export default (routes: Route[]): Route[] => {
  const play = routes.find((r) => r.path === "/:no");
  if (!play) return routes;

  const langPlay: Route = { ...play, name: "play-lang", path: "/:lang(fr|en)/:no" };
  const langRedirect: Route = {
    path: "/:lang(fr|en)",
    redirect: (to: { params: { lang: string } }) => `/${to.params.lang}/1`,
  };

  // Insérer AVANT le catch-all 404 (sinon il avale /fr/12).
  const notFoundIdx = routes.findIndex((r) => r.name === "NotFound");
  const at = notFoundIdx === -1 ? routes.length : notFoundIdx;
  routes.splice(at, 0, langPlay, langRedirect);
  return routes;
};

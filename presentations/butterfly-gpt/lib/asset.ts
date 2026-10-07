// ═══════════════════════════════════════════════════════════════════════════
// Résolution d'un asset PUBLIC (dossier public/) compatible « base path ».
// ═══════════════════════════════════════════════════════════════════════════
// POURQUOI (intuition) : un asset de public/ référencé en chemin absolu
// (`/x.png`) n'est PAS réécrit par Vite dès qu'on l'utilise *dynamiquement* —
// binding `:src`, prop de composant (`<Plate src=…>`), `url()` calculé. Or sous
// une base `/loic-truchot/projects/butterfly-gpt/` (déploiement en sous-chemin), `/x.png` pointe à la
// RACINE du domaine → 404. La doc Vite prescrit `import.meta.env.BASE_URL` pour
// exactement ces cas (les URLs statiquement analysables, elles, sont réécrites
// toutes seules ; pas les nôtres).
//
// `import.meta.env.BASE_URL` vaut `/` en dev et `/loic-truchot/projects/butterfly-gpt/` au build : le
// MÊME code marche donc en local ET en ligne. Doit apparaître littéralement
// (remplacé statiquement par Vite) — ne pas le passer par une variable.
export function withBase(path: string | undefined): string {
  // BASE_URL finit toujours par `/` ; on retire le(s) `/` de tête du chemin
  // pour éviter le double slash. Vaut pour TOUT asset public (img, svg, json…).
  // Tolère `undefined` (props d'image optionnelles, toujours gardées par un
  // `v-if` côté layout) → renvoie alors juste la base.
  return import.meta.env.BASE_URL + (path ?? "").replace(/^\/+/, "");
}

# Matrix Comics — Charte graphique

Charte graphique **« Matrix en mode comics »** (patte flat / bande dessinée,
sans le cliché vert-fluo-sur-fond-noir), construite **au-dessus** du thème
[`slidev-theme-light-icons`](https://github.com/lightvue/slidev-theme-light-icons)
— sans le forker (couche locale `styles/` + `layouts/` + web components
`src/components/`).

Référence visuelle : le comic muet **« Butterfly » de Dave Gibbons**
(_The Matrix Comics_, série 2). Voir la slide « Sources ».

```sh
# depuis la racine du monorepo
vp install
vp run --filter @vp-monorepo-butterfly-gpt/matrix-comics-showcase dev
```

Ouvrir <http://localhost:11119>.

Ce deck est la **vitrine du système de design** de `presentations/butterfly-gpt`
(rôle Storybook). La **source de vérité est le deck réel** : les dispositifs qui
s'y répètent (cartouches `.panel-*`, boutons `.btn*`, `.tag`, `.band`, en-tête
`# titre` + `.rule-ink`, web components `<bgpt-sfx>`/`<bgpt-plate>`, layouts
`cover`/`image-bg`/`image-blur`) sont **rétro-portés** ici, à l'identique
(deltas documentés en tête de fichier : pas d'i18n dans la vitrine).

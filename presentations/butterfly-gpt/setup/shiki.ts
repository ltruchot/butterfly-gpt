// Thème de coloration du code = `light-plus` (thème clair par défaut de VS Code :
// texte noir, bleu/rouge francs, archi-standard, lisible sur fond blanc). On force
// light-plus AUSSI pour le `dark` : même si un mode sombre s'invitait, le code
// resterait foncé/lisible sur le fond blanc (cf. charte.css `.slidev-code{background:#fff}`).
// Combiné à `colorSchema: light` dans slides.md, ceinture + bretelles.
//
// NB : on N'IMPORTE PAS `defineShikiSetup` de `@slidev/types` (paquet non résolu
// par le type-check du monorepo → TS2307 au commit). Ce n'est qu'un helper de
// typage ; Slidev appelle simplement l'export default (une fonction → la config).
export default () => ({
  themes: {
    light: "light-plus",
    dark: "light-plus",
  },
});

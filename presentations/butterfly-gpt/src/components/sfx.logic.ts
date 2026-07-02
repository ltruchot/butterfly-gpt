// ═══════════════════════════════════════════════════════════════════════════
// Logique pure du lettrage SFX (onomatopée façon BD). Zéro DOM, zéro dépendance.
// ═══════════════════════════════════════════════════════════════════════════
// POURQUOI : on isole le mapping « props → classes/style » pour le tester seul ;
// le web component (sfx.ts) ne fait ensuite que poser ces classes sur un <span>.
// Les classes (.sfx, .sfx-crimson, .sfx-vertical) vivent dans styles/charte.css.

// Palette du lettrage : 'amber' (défaut) | 'crimson' | 'teal' | 'ink' | 'slate'
// | 'white'. On ne valide pas : une couleur inconnue donne juste `.sfx-x` sans
// règle CSS (retombe sur la couleur de base `.sfx`).
export const SFX_DEFAULT_COLOR = "amber";
export const SFX_DEFAULT_SIZE = "3.5rem";

// Liste de classes du <span> : toujours `.sfx`, plus la teinte, plus l'option
// verticale (lettrage de marge « BRRRINNNG »).
export const sfxClasses = (color: string, vertical: boolean): string =>
  ["sfx", `sfx-${color || SFX_DEFAULT_COLOR}`, vertical ? "sfx-vertical" : ""]
    .filter(Boolean)
    .join(" ");

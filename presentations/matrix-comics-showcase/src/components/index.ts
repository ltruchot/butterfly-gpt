// ═══════════════════════════════════════════════════════════════════════════
// Barrel des web components <bgpt-*> de la charte (vitrine).
// ═══════════════════════════════════════════════════════════════════════════
// Copie réduite de butterfly-gpt/src/components/index.ts (la source de vérité) :
// la vitrine n'embarque QUE les composants du design system (sfx, plate) — les
// widgets interactifs (tirage, param-cloud, dérivées…) sont des one-off du deck
// réel, hors charte. Pas de pont `window.bgpt` non plus (aucun bloc Datastar ici).
// Importé une fois par setup/main.ts ; chaque `register()` est idempotent et
// sûr hors navigateur (build/SSR).
import { register as registerPlate } from "./plate.ts";
import { register as registerSfx } from "./sfx.ts";

export const registerComponents = (): void => {
  registerSfx();
  registerPlate();
};

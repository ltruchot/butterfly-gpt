// ═══════════════════════════════════════════════════════════════════════════
// Barrel des web components <bgpt-*> + pont logique pour les expressions Datastar.
// ═══════════════════════════════════════════════════════════════════════════
// Importé une fois par setup/main.ts (côté client). Deux responsabilités :
//  1. Enregistrer les custom elements (chaque module a un `register()` idempotent,
//     sûr hors navigateur).
//  2. Exposer la LOGIQUE PURE sur `window.bgpt` pour que le markup Datastar des
//     slides l'appelle dans ses expressions, p.ex.
//        <span data-text="window.bgpt.sm.surpriseStr($pct)"></span>
//     C'est l'idiome déjà en place dans le deck (les pages « code exécuté »
//     exposent un `window.X`). On centralise ici plutôt qu'un <script> par page.
import { domLang, resolve } from "../../i18n/dict.ts";
import { withBase } from "../../lib/asset.js";
import * as chaineRamifiee from "./chaine-ramifiee.logic.ts";
import * as derivee from "./derivee.logic.ts";
import * as deriveePartielle from "./derivee-partielle.logic.ts";
import * as logexp from "./logexp.logic.ts";
import * as sm from "./surprise-mini.logic.ts";
import { register as registerChaineRamifiee } from "./chaine-ramifiee.ts";
import { register as registerDerivee } from "./derivee.ts";
import { register as registerDeriveePartielle } from "./derivee-partielle.ts";
import { register as registerLogexp } from "./logexp.ts";
import { register as registerParamCloud } from "./param-cloud.ts";
import { register as registerPlate } from "./plate.ts";
import { register as registerSfx } from "./sfx.ts";
import { register as registerTirage } from "./tirage-gaussien.ts";

// Espace de noms exposé aux expressions Datastar (un sous-objet par widget).
// `t(cle)` résout une chaîne du dictionnaire i18n dans la langue active — sert
// aux LIBELLÉS STATIQUES des démos en bloc `v-pre` (où `{{ $t() }}` ne passe pas) :
//   <span data-text="window.bgpt.t('logarithme.mirror')"></span>
const BGPT = {
  sm,
  logexp,
  derivee,
  deriveePartielle,
  chaineRamifiee,
  t: (key: string): string => resolve(domLang(), key),
  // Résout un asset public en tenant compte de la base path (`/loic-truchot/projects/butterfly-gpt/` en
  // prod) — pendant de `$asset`, mais appelable dans un bloc `v-pre` Datastar où
  // Vue ne compile pas (`data-attr:href="window.bgpt.asset('/x.json')"`).
  asset: (path: string): string => withBase(path),
};

export const registerComponents = (): void => {
  registerSfx();
  registerPlate();
  registerLogexp();
  registerDerivee();
  registerDeriveePartielle();
  registerChaineRamifiee();
  registerParamCloud();
  registerTirage();
  if (typeof window !== "undefined") {
    (window as unknown as { bgpt?: typeof BGPT }).bgpt = BGPT;
  }
};

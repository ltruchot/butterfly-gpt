// Enregistre les web components <bgpt-*> de la charte côté client (idempotent,
// no-op en SSR). Pendant réduit du setup/main.ts de butterfly-gpt (la source de
// vérité) : pas d'i18n ni de routage bilingue ici — la vitrine est monolingue.
// On N'IMPORTE PAS `defineAppSetup` de `@slidev/types` (non résolu par le
// type-check du monorepo pour les fichiers setup) : Slidev appelle simplement
// l'export default avec le contexte.
import { registerComponents } from "../src/components/index.ts";

registerComponents();

export default (): void => {};

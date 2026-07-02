import { expect, type Page } from "@playwright/test";

// ═══════════════════════════════════════════════════════════════════════════
// Helpers E2E partagés pour le deck Slidev.
// ═══════════════════════════════════════════════════════════════════════════

export const PORT = 11117;
export const BASE = `http://localhost:${PORT}`;

// Indices de slide (1-based, cover = 1) calés sur l'ORDRE de `slides.md`.
// ⚠️ Si l'ordre des pages change, mettre à jour cette table (et seulement elle).
export const SLIDE = {
  tirage: 20, // 5aa-tirage-gaussien.md → bgpt-tirage (cible Box-Muller, Datastar)
  logarithme: 33, // 1b-logarithme.md → SurpriseMini + LogExpPapillon
  derivee: 25, // 6c-la-derivee.md → DeriveePapillon
  schema: 54, // annexe-schema.md → schéma du forward pass, tooltips CSS
  deriveePartielle: 57, // annexe-derivee-partielle.md
  chaineRamifiee: 58, // annexe-regle-chaine-multivariable.md
  parametres3d: 61, // 5b-parameters-3d.md → ParamCloud3D (interactif)
} as const;

// Bruit d'environnement Slidev/navigateur, sans rapport avec nos composants :
// Slidev demande un Wake Lock (garder l'écran allumé en présentation) que
// Chromium headless refuse → message d'erreur bénin, à ignorer.
const BENIGN = [/Wake Lock/i];

// Garde « zéro erreur runtime » : collecte console.error + pageerror, hors
// bruit bénin. On ramasse AUSSI les warnings « failed to resolve component »
// (Vue les émet en warn, pas en error) : une fois passés aux tags <bgpt-*>,
// c'est LE signal qu'un custom element n'est pas reconnu (élément affiché mais
// câblage cassé) — exactement ce qu'on veut faire échouer.
export const collectErrors = (page: Page): string[] => {
  const errs: string[] = [];
  const keep = (text: string) => {
    if (BENIGN.some((re) => re.test(text))) return;
    errs.push(text);
  };
  page.on("console", (m) => {
    if (m.type() === "error") keep(m.text());
    else if (m.type() === "warning" && /failed to resolve component/i.test(m.text()))
      keep(m.text());
  });
  page.on("pageerror", (e) => keep(e.message));
  return errs;
};

export type Lang = "fr" | "en";

// Va sur une slide précise et renvoie le conteneur de CETTE diapo. Le deck est
// désormais bilingue : l'URL porte un segment de langue (`/fr/<n>` ou `/en/<n>`).
// On cible la langue EXPLICITEMENT (défaut FR) pour des tests déterministes,
// indépendants d'un éventuel choix mémorisé. Slidev garde les diapos voisines
// dans le DOM → on scope sur `.slidev-page-<n>`.
export const gotoSlide = async (page: Page, n: number, lang: Lang = "fr") => {
  await page.goto(`${BASE}/${lang}/${n}`, { waitUntil: "networkidle" });
  const slide = page.locator(`.slidev-page-${n}`);
  await expect(slide).toBeVisible({ timeout: 10_000 });
  return slide;
};

// Révèle les `v-click` d'une slide : Slidev avance d'un cran par flèche droite.
// Sur une diapo à k builds, k pressions amènent au dernier cran (widget visible)
// sans quitter la slide.
export const revealClicks = async (page: Page, k: number): Promise<void> => {
  for (let i = 0; i < k; i++) {
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(150);
  }
};

// Règle un <input type="range"> à une valeur et émet l'événement `input`
// (ce que fait un vrai glissement). Renvoie après que le binding a réagi.
export const setRange = async (
  page: Page,
  locator: ReturnType<Page["locator"]>,
  value: number,
): Promise<void> => {
  await locator.evaluate((el, v) => {
    const input = el as HTMLInputElement;
    input.value = String(v);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
};

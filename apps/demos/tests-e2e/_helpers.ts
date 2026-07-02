// ═══════════════════════════════════════════════════════════════════════════
// Helpers Playwright partagés par tous les specs E2E (Hono + Datastar + SSE).
// Les URLs sont RELATIVES : la baseURL vit dans playwright.config.ts.
// ═══════════════════════════════════════════════════════════════════════════
import type { Page } from "@playwright/test";

// Guard « zéro erreur runtime Datastar ». On attache les listeners AVANT le
// premier goto pour catcher `KeyAndValueProvided`,
// `PatchElementsNoTargetsFound`, `SignalNotFound`, etc.
export const collectDatastarErrors = (page: Page): string[] => {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));
  return errors;
};

// Navigue vers la démo et attend la handshake SSE AVANT toute interaction.
// IMPORTANT : on arme l'écoute de `<path>/subscribe` AVANT `page.goto` —
// Datastar déclenche `data-init` dès le chargement, donc en headless rapide la
// requête part PENDANT le goto ; si on attendait après, on l'aurait déjà ratée.
export const gotoAndSubscribe = async (page: Page, path: string): Promise<void> => {
  const subscribed = page.waitForRequest((req) => req.url().includes(`${path}/subscribe`), {
    timeout: 5000,
  });
  await page.goto(path);
  await subscribed;
};

// Anti-flake pour les enchaînements de clics « Next » rapides : on attend le
// round-trip du POST avant le clic suivant — sinon un clic peut partir pendant
// un morph et être perdu (le bouton est recréé). `path` = préfixe de la démo
// (ex. "/tokenizer").
export const clickNext = async (page: Page, path: string): Promise<void> => {
  const resp = page.waitForResponse((r) => r.url().includes(`${path}/next`));
  await page.getByTestId("next").click();
  await resp;
};

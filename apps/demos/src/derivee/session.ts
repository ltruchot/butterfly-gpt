import { makePubSub } from "../views/pubsub.ts";

// ════════════════════════════════════════════════════════════════════════
// SESSION derivee — le skieur dans le brouillard (interlude math « ∂ »)
// ════════════════════════════════════════════════════════════════════════
// Avant l'autograd, on montre À QUOI SERT une dérivée : un skieur aveuglé par
// le brouillard descend une piste-parabole en ne sentant que la pente sous
// ses skis. C'est la descente de gradient sur UN seul poids.
//
// Porté depuis apps/math (page Vite vanilla, DOM impératif) : ici l'état vit
// côté SERVEUR et chaque pas est poussé en morph SSE. Le morph remplace
// l'animation easing de la page d'origine — un pas = un nouvel état = un
// nouveau rendu, c'est tout.

// La piste : une parabole lisse à un seul creux (w = 5). C'est la forme
// d'erreur idéale : plus on s'en éloigne, plus la pente est forte, donc la
// dérivée « prévient » toute seule quand on approche du fond.
export const f = (w: number): number => 0.3 * (w - 5) ** 2 + 0.5;
// Sa dérivée, obtenue par les règles de dérivation : 0,6 · (w − 5).
export const fPrime = (w: number): number => 0.6 * (w - 5);

// Bornes du terrain et réglages — mêmes valeurs que la page apps/math.
export const W_MIN = 0;
export const W_MAX = 10;
export const W_INIT = 1.0;
export const ETA_INIT = 0.5;
export const ETA_MIN = 0.05;
export const ETA_MAX = 3.5;

const TRAIL_MAX = 200; // la trace orange garde au plus 200 positions
const AUTO_PAUSE_MS = 250; // pause entre deux pas du mode automatique
const MAX_AUTO_STEPS = 60; // garde-fou : jamais plus de 60 pas d'affilée
const ARRIVED_SLOPE = 0.005; // |pente| en dessous → on considère être arrivé

export type SessionSnapshot = {
  readonly w: number; // position courante du skieur
  readonly eta: number; // taille du pas η (réglée par le slider)
  readonly trail: readonly number[]; // positions déjà visitées (la trace)
  readonly auto: boolean; // descente automatique en cours ?
};

type SessionState = {
  w: number;
  eta: number;
  trail: readonly number[];
  auto: boolean;
  runId: number; // invalide la boucle auto en cours (stop / reset)
};

const initial = (): SessionState => ({
  w: W_INIT,
  eta: ETA_INIT,
  trail: [],
  auto: false,
  runId: 0,
});

let state: SessionState = initial();

const snapshot = (): SessionSnapshot => ({
  w: state.w,
  eta: state.eta,
  trail: state.trail,
  auto: state.auto,
});

// Rendu injecté par le routeur (évite tout doute de cycle d'import) — même
// mécanique que la démo /train, dont la boucle serveur broadcast aussi.
let render: (s: SessionSnapshot) => string = () => "";
export const setRenderer = (fn: (s: SessionSnapshot) => string): void => {
  render = fn;
};
const pushAll = (): void => broadcast(render(snapshot()));

// On garde le skieur SUR le terrain visible (petite marge de 0,05 comme dans
// la page d'origine) : avec un η énorme le pas peut projeter hors cadre.
const clampW = (w: number): number => Math.max(W_MIN + 0.05, Math.min(W_MAX - 0.05, w));

/**
 * Un pas de descente de gradient — SANS animation : le morph SSE qui suit
 * suffit à montrer le déplacement. On mémorise la position quittée dans la
 * trace, puis w ← clamp(w − η · f'(w)) : sens opposé à la pente, longueur
 * proportionnelle à la pente et amplifiée par η.
 */
export const step = (): void => {
  const trail = [...state.trail, state.w].slice(-TRAIL_MAX);
  const w = clampW(state.w - state.eta * fPrime(state.w));
  state = { ...state, trail, w };
};

/**
 * Descente automatique : boucle SERVEUR (comme /train) qui enchaîne les pas
 * toutes les ~250 ms et broadcast un morph après chacun. S'arrête toute seule
 * quand la pente devient quasi nulle (arrivé) ou après MAX_AUTO_STEPS
 * (garde-fou contre les η qui font osciller sans fin).
 */
export const startAuto = (): void => {
  if (state.auto) return;
  const runId = state.runId + 1;
  state = { ...state, auto: true, runId };
  let steps = 0;

  const tick = (): void => {
    if (state.runId !== runId || !state.auto) return; // annulé entre-temps
    step();
    steps += 1;
    const done = steps >= MAX_AUTO_STEPS || Math.abs(fPrime(state.w)) < ARRIVED_SLOPE;
    if (done) state = { ...state, auto: false };
    pushAll();
    if (!done) setTimeout(tick, AUTO_PAUSE_MS);
  };

  // Premier pas immédiat (comme la page d'origine) : le morph qui en résulte
  // affiche aussi le bouton « ■ stop » sans attendre la première pause.
  tick();
};

/** Coupe la descente automatique (le runId invalide le setTimeout en vol). */
export const stopAuto = (): void => {
  state = { ...state, auto: false, runId: state.runId + 1 };
};

/** Règle η depuis le slider, clampé aux bornes (le signal vient du client). */
export const setEta = (v: number): void => {
  if (!Number.isFinite(v)) return; // signal absent ou corrompu : on ignore
  state = { ...state, eta: Math.min(ETA_MAX, Math.max(ETA_MIN, v)) };
};

/**
 * Replace le skieur au départ. Contrairement à la page apps/math (où η
 * survivait car purement client), on restaure AUSSI η : l'état est un
 * singleton serveur partagé, un reset doit rendre la démo déterministe
 * pour le visiteur suivant (et pour les tests E2E).
 */
export const reset = (): void => {
  state = { ...initial(), runId: state.runId + 1 };
};

// Canal SSE de la démo — fabrique partagée (Set de subscribers isolé ici).
export const { subscribe, broadcast } = makePubSub();

export const getSnapshot = (): SessionSnapshot => snapshot();

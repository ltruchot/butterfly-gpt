import { makePubSub } from "../views/pubsub.ts";

// ════════════════════════════════════════════════════════════════════════
// SESSION produit-scalaire — état mono-visiteur + broadcast SSE
// ════════════════════════════════════════════════════════════════════════
// Interlude math avant l'attention (étape 7). a·b = ax·bx + ay·by
// = |a|·|b|·cos(θ). Avec deux vecteurs de longueur 1, a·b = cos(θ) : on voit
// directement « même sens → 1, perpendiculaire → 0, sens opposé → −1 ».
// Le produit scalaire mesure à quel point deux directions « sont d'accord ».
//
// L'état minimal est UN seul nombre : l'angle θ en degrés (le slider).
// Tout le reste (bx, by, dot, verdict) est un calcul PUR dérivé de deg.

// a est fixe (vers la droite), b tourne. Vecteurs unités.
const AX = 1;
const AY = 0;

const DEFAULT_DEG = 40;

export type SessionSnapshot = {
  readonly deg: number; // angle θ en degrés entiers (0..360)
  readonly ax: number;
  readonly ay: number;
  readonly bx: number;
  readonly by: number;
  readonly dot: number; // = cos(θ) puisque |a| = |b| = 1
  readonly verdict: string;
};

type SessionState = { deg: number };
const empty = (): SessionState => ({ deg: DEFAULT_DEG });

let state: SessionState = empty();

// Le slider est entier (pas de `step` décimal) : on arrondit, puis on borne
// à [0, 360] — le serveur ne fait jamais confiance à ce qui vient du client.
const clampDeg = (n: number): number => Math.min(360, Math.max(0, Math.round(n)));

// Les vecteurs étant de longueur 1, a·b = cos(θ) : le seuil 0.5 correspond
// à θ = 60° et le seuil -0.5 à θ = 120°.
const verdict = (dot: number): string => {
  if (dot > 0.5) return "angle aigu (< 60°) → directions proches (a·b grand et positif)";
  if (dot > -0.5) return "angle entre 60° et 120° → ni proches ni opposées (a·b petit)";
  return "angle obtus (> 120°) → directions plutôt opposées (a·b négatif)";
};

// Projection pure : degrés → tout ce que la vue affiche.
const compute = (deg: number): SessionSnapshot => {
  const theta = (deg * Math.PI) / 180;
  const bx = Math.cos(theta);
  const by = Math.sin(theta);
  const dot = AX * bx + AY * by; // = cos(θ)
  return { deg, ax: AX, ay: AY, bx, by, dot, verdict: verdict(dot) };
};

export const setDeg = (n: number): void => {
  // Une valeur non numérique (signal absent/corrompu) laisse l'état intact.
  if (Number.isFinite(n)) state = { deg: clampDeg(n) };
};

export const reset = (): void => {
  state = empty();
};

// Canal SSE de la démo — fabrique partagée (Set de subscribers isolé ici).
export const { subscribe, broadcast } = makePubSub();

export const getSnapshot = (): SessionSnapshot => compute(state.deg);

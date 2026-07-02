// ═══════════════════════════════════════════════════════════════════════════
// Logique pure de la règle de la chaîne MULTIVARIABLE = le CUMUL des dérivées.
// ═══════════════════════════════════════════════════════════════════════════
// POURQUOI (intuition) : ma vitesse de base (🏡, 5 km/h) sert à mes 6 trajets de
// la semaine. La dérivée d'UN trajet = de combien il accélère quand ma base gagne
// +1 km/h = son « facteur ». À pied le facteur vaut ×1 ; à vélo ×bike ; en voiture
// ×bike×car (j'enchaîne vélo PUIS voiture → un PRODUIT, c'est ça « la chaîne »).
// La pente ∂(ma semaine)/∂(ma vitesse) = la SOMME des 6 facteurs : on ACCUMULE,
// on ne moyenne pas. C'est la clé de la rétropropagation (un nœud partagé par
// plusieurs chemins cumule les gradients de tous ses chemins).
//
// Tout le calcul est isolé ici (zéro DOM, zéro dépendance) pour être testé seul ;
// le composant ne fait ensuite que brancher les curseurs et dessiner.

// ── Repère pixels du dessin (le SVG fait W×H) ─────────────────────────────────
export const W = 600;
export const H = 180;
export const SX = 72; // x du nœud départ (🏡)
export const EX = 528; // x du nœud arrivée (🏢)
export const MY = 90; // y de référence (milieu vertical)
export const MIDX = (SX + EX) / 2;
// les 6 « créneaux » verticaux des trajets, du plus haut au plus bas
export const AYS = [24, 52, 80, 108, 136, 164] as const;

// ── La chaîne : marcheur (base, FIXE) → vélo ×bike → voiture ×car ─────────────
export const BASE_KMH = 5;

// Les 3 modes de transport : emoji + couleur de charte.
export const MODES = {
  pied: { emoji: "🚶", color: "var(--teal)" },
  velo: { emoji: "🚴", color: "var(--amber)" },
  voiture: { emoji: "🚗", color: "var(--crimson)" },
} as const;
export type Mode = keyof typeof MODES;

// Dérivée d'un trajet = son facteur d'accélération par +1 km/h de base.
// pied ×1 ; vélo ×bike ; voiture ×bike×car (le vélo PUIS la voiture → un PRODUIT).
export const factorOf = (mode: Mode, bike: number, car: number): number =>
  mode === "pied" ? 1 : mode === "velo" ? bike : bike * car;

// Étiquette affichée du facteur (« ×1 », « ×4 », « ×8 »…).
export const labelOf = (mode: Mode, bike: number, car: number): string =>
  `×${factorOf(mode, bike, car)}`;

// Le reste de la semaine (6 jours en tout) se fait à pied. vélo et voiture vont
// chacun de 0 à 3 (3 + 3 = 6) → le reste est toujours ≥ 0.
export const nPiedOf = (nVelo: number, nVoiture: number): number => 6 - nVelo - nVoiture;

// Un trajet prêt à dessiner : son mode, sa hauteur, son visuel et sa dérivée.
export type Trip = {
  readonly mode: Mode;
  readonly ay: number;
  readonly emoji: string;
  readonly color: string;
  readonly factor: number;
  readonly label: string;
};

// Les 6 trajets de la semaine, ordonnés du plus lent (pied, en haut) au plus
// rapide (voiture, en bas).
export const tripsOf = (
  nPied: number,
  nVelo: number,
  nVoiture: number,
  bike: number,
  car: number,
): Trip[] => {
  const modes: Mode[] = [
    ...Array<Mode>(nPied).fill("pied"),
    ...Array<Mode>(nVelo).fill("velo"),
    ...Array<Mode>(nVoiture).fill("voiture"),
  ];
  return modes.map((mode, i) => ({
    mode,
    ay: AYS[i]!,
    ...MODES[mode],
    factor: factorOf(mode, bike, car),
    label: labelOf(mode, bike, car),
  }));
};

// La pente = le CUMUL des dérivées des 6 trajets (la somme, sans diviser).
export const totalOf = (trips: readonly Trip[]): number => trips.reduce((s, t) => s + t.factor, 0);

// ── Accesseurs d'AFFICHAGE (pour le markup Datastar de la slide) ───────────────
// Les valeurs viennent de signaux reliés à des <input range> → chaînes → Number.
const tripsFrom = (
  nVelo: number | string,
  nVoiture: number | string,
  bike: number | string,
  car: number | string,
): Trip[] => {
  const nv = Number(nVelo);
  const nvo = Number(nVoiture);
  return tripsOf(nPiedOf(nv, nvo), nv, nvo, Number(bike), Number(car));
};

export const nPiedStr = (nVelo: number | string, nVoiture: number | string): string =>
  String(nPiedOf(Number(nVelo), Number(nVoiture)));

// Le cumul affiché en clair : « 1 + 1 + 4 + 4 + 8 + 8 » (on ADDITIONNE).
export const breakdownStr = (
  nVelo: number | string,
  nVoiture: number | string,
  bike: number | string,
  car: number | string,
): string =>
  tripsFrom(nVelo, nVoiture, bike, car)
    .map((t) => t.factor)
    .join(" + ");

export const totalStr = (
  nVelo: number | string,
  nVoiture: number | string,
  bike: number | string,
  car: number | string,
): string => String(totalOf(tripsFrom(nVelo, nVoiture, bike, car)));

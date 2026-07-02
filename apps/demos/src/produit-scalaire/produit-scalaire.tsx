import type { FC } from "hono/jsx";
import type { SessionSnapshot } from "./session.ts";

// ════════════════════════════════════════════════════════════════════════
// <ProduitScalaire> — interlude math /produit-scalaire (avant l'attention)
// ════════════════════════════════════════════════════════════════════════
// Porté de apps/math/src/produit-scalaire.ts : mêmes maths, même figure,
// mêmes textes — mais la figure et le readout sont rendus CÔTÉ SERVEUR
// depuis l'état, et le slider parle en Datastar (un seul signal : $deg).

const VIEW = 320;
const C = VIEW / 2; // origine au centre
const S = 110; // échelle (longueur d'un vecteur unité, en pixels)

// Format du source math : 2 décimales fixes (≠ fmt partagé à 3 décimales).
const fmt = (n: number): string => n.toFixed(2);

// La figure : a fixe (vers la droite), b tourne. Coordonnées écran
// (y vers le bas → on inverse le signe de y).
const Figure: FC<{ state: SessionSnapshot }> = ({ state }) => {
  const aX = C + state.ax * S;
  const aY = C - state.ay * S;
  const bX = C + state.bx * S;
  const bY = C - state.by * S;
  return (
    <svg
      viewBox={`0 0 ${VIEW} ${VIEW}`}
      width="100%"
      style={`max-width:${VIEW}px`}
      role="img"
      aria-label="Deux vecteurs et leur angle"
    >
      <line x1="0" y1={C} x2={VIEW} y2={C} stroke="#eee" />
      <line x1={C} y1="0" x2={C} y2={VIEW} stroke="#eee" />
      <line x1={C} y1={C} x2={aX} y2={aY} stroke="#1a1a1a" stroke-width="3" />
      <circle cx={aX} cy={aY} r="4" fill="#1a1a1a" />
      <text x={aX + 8} y={aY + 4} font-size="14" fill="#1a1a1a">
        a
      </text>
      <line x1={C} y1={C} x2={bX.toFixed(1)} y2={bY.toFixed(1)} stroke="#f97316" stroke-width="3" />
      <circle cx={bX.toFixed(1)} cy={bY.toFixed(1)} r="4" fill="#f97316" />
      <text x={(bX + 8).toFixed(1)} y={bY.toFixed(1)} font-size="14" fill="#f97316">
        b
      </text>
    </svg>
  );
};

export const App: FC<{ state: SessionSnapshot }> = ({ state }) => (
  <main id="app" data-init="@get('/produit-scalaire/subscribe')" data-preserve-attr="data-init">
    <header>
      <h1>Le produit scalaire</h1>
      <p class="graph-block-subtitle">
        Un seul nombre qui dit si deux vecteurs « vont dans le même sens ». Ici les deux vecteurs
        ont la longueur 1, donc <code>a·b = cos(θ)</code>, où <code>θ</code> est l'angle entre eux.
      </p>
      <p class="graph-block-subtitle">
        <strong>Pourquoi cette page ?</strong> C'est exactement ce que fait{" "}
        <a href="/attention">l'attention (étape 7)</a> : mesurer l'accord entre deux vecteurs.
      </p>
    </header>

    <section class="graph-block" data-testid="dot-block">
      <div class="graph" id="fig">
        <Figure state={state} />
      </div>

      <div class="graph-block-controls" id="controls">
        <label for="angle">angle θ entre a et b :</label>
        {/* data-bind forme-clé SEULE (auto-crée $deg) — jamais key + value.
            Le POST ne porte pas de payload : Datastar envoie les signaux.
            Le modifier `.100ms` passe en spread : oxfmt refuse un point suivi
            de chiffres dans un nom d'attribut JSX littéral. */}
        <input
          type="range"
          id="angle"
          data-testid="angle-slider"
          min="0"
          max="360"
          value={state.deg}
          data-bind:deg=""
          {...{ "data-on:input__debounce.100ms": "@post('/produit-scalaire/angle')" }}
        />
        <span id="angleVal">{state.deg}°</span>
        <button type="button" data-testid="reset" data-on:click="@post('/produit-scalaire/reset')">
          ↻ Reset
        </button>
      </div>

      <div class="graph-block-step" id="readout" data-testid="readout">
        a = ({fmt(state.ax)}, {fmt(state.ay)}){"  "}b = ({fmt(state.bx)}, {fmt(state.by)})
        <br />
        a·b = {fmt(state.ax)}·{fmt(state.bx)} + {fmt(state.ay)}·{fmt(state.by)} ={" "}
        <strong style="color: var(--accent)">{fmt(state.dot)}</strong>
        {" "}(= cos {state.deg}°)
        <br />→ <span data-testid="verdict">{state.verdict}</span>
      </div>

      <p class="graph-block-subtitle" style="margin-top: .75rem">
        Deux calculs, toujours égaux : par les coordonnées <code>a·b = ax·bx + ay·by</code>, ou par
        la géométrie <code>a·b = |a|·|b|·cos(θ)</code>. Le signe donne la nature de l'angle :
        positif = aigu, nul = droit (perpendiculaire), négatif = obtus.
      </p>
    </section>
  </main>
);

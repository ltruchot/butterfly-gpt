import type { FC } from "hono/jsx";
import type { SessionSnapshot } from "./session.ts";

// ════════════════════════════════════════════════════════════════════════
// <Logarithme> — interlude math /logarithme (avant la loss)
// ════════════════════════════════════════════════════════════════════════
// Porté de apps/math/src/logarithme.ts : mêmes maths, même figure, mêmes
// textes — mais la courbe et le readout sont rendus CÔTÉ SERVEUR depuis
// l'état, et le slider parle en Datastar (un seul signal : $x).

const W = 380;
const H = 260;
const PAD_L = 38;
const PAD_R = 16;
const PAD_T = 16;
const PAD_B = 28;
const X_MAX = 8;
const Y_MIN = -3;
const Y_MAX = 2.2;

// Format du source math : 2 décimales fixes (≠ fmt partagé à 3 décimales).
const fmt = (n: number): string => n.toFixed(2);

// Projections maths → pixels (repère écran : y grandit vers le bas).
const xAt = (x: number): number => PAD_L + (x / X_MAX) * (W - PAD_L - PAD_R);
const yAt = (y: number): number => PAD_T + ((Y_MAX - y) / (Y_MAX - Y_MIN)) * (H - PAD_T - PAD_B);

// La courbe ln échantillonnée en 200 points — indépendante de l'état,
// calculée une seule fois au chargement du module.
const CURVE: string = Array.from({ length: 200 }, (_, i) => {
  const x = ((i + 1) / 200) * X_MAX;
  return `${xAt(x).toFixed(1)},${yAt(Math.log(x)).toFixed(1)}`;
}).join(" ");

const Figure: FC<{ state: SessionSnapshot }> = ({ state }) => {
  const y0 = yAt(0);
  const px = xAt(state.x);
  const py = yAt(state.ln);
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      style={`max-width:${W}px`}
      role="img"
      aria-label="Courbe de ln(x)"
    >
      <line x1={PAD_L} y1={y0.toFixed(1)} x2={W - PAD_R} y2={y0.toFixed(1)} stroke="#ccc" />
      <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={H - PAD_B} stroke="#ccc" />
      <polyline points={CURVE} fill="none" stroke="#f97316" stroke-width="2" />
      <line
        x1={px.toFixed(1)}
        y1={PAD_T}
        x2={px.toFixed(1)}
        y2={(H - PAD_B).toFixed(1)}
        stroke="#ddd"
        stroke-dasharray="3 3"
      />
      <circle cx={px.toFixed(1)} cy={py.toFixed(1)} r="5" fill="#1a1a1a" />
      <text
        x={xAt(1).toFixed(1)}
        y={(y0 + 14).toFixed(1)}
        text-anchor="middle"
        font-size="11"
        fill="#999"
      >
        1
      </text>
      <text
        x={xAt(Math.E).toFixed(1)}
        y={(y0 + 14).toFixed(1)}
        text-anchor="middle"
        font-size="11"
        fill="#999"
      >
        e
      </text>
      <text
        x={(W - PAD_R).toFixed(1)}
        y={(y0 + 14).toFixed(1)}
        text-anchor="end"
        font-size="11"
        fill="#999"
      >
        x={X_MAX}
      </text>
    </svg>
  );
};

export const App: FC<{ state: SessionSnapshot }> = ({ state }) => (
  <main id="app" data-init="@get('/logarithme/subscribe')" data-preserve-attr="data-init">
    <header>
      <h1>Le logarithme (ln)</h1>
      <p class="graph-block-subtitle">
        <code>ln(x)</code> répond à : « à quelle puissance élever <code>e ≈ 2,718</code> pour
        obtenir <code>x</code> ? ». C'est la fonction réciproque de l'exponentielle. Déplace le
        curseur et regarde la courbe.
      </p>
      <p class="graph-block-subtitle">
        <strong>Pourquoi cette page ?</strong> C'est le <code>−ln(p)</code> de{" "}
        <a href="/loss">la loss (étape 10)</a> : transformer une probabilité en surprise.
      </p>
    </header>

    <section class="graph-block" data-testid="ln-block">
      <div class="graph" id="fig">
        <Figure state={state} />
      </div>

      <div class="graph-block-controls" id="controls">
        <label for="x">x :</label>
        {/* data-bind forme-clé SEULE (auto-crée $x) — jamais key + value.
            Le POST ne porte pas de payload : Datastar envoie les signaux.
            Le modifier `.100ms` passe en spread : oxfmt refuse un point suivi
            de chiffres dans un nom d'attribut JSX littéral. */}
        <input
          type="range"
          id="x"
          data-testid="x-slider"
          min="0.1"
          max="8"
          step="0.1"
          value={state.x}
          data-bind:x=""
          {...{ "data-on:input__debounce.100ms": "@post('/logarithme/x')" }}
        />
        <span id="xVal">{fmt(state.x)}</span>
        <button type="button" data-testid="reset" data-on:click="@post('/logarithme/reset')">
          ↻ Reset
        </button>
      </div>

      <div class="graph-block-step" id="readout" data-testid="readout">
        ln({fmt(state.x)}) = <strong style="color: var(--accent)">{fmt(state.ln)}</strong>
      </div>

      <p class="graph-block-subtitle" style="margin-top: .75rem">
        Repères : <code>ln(1) = 0</code>, <code>ln(e) = 1</code> ; quand <code>x → 0</code>,{" "}
        <code>ln(x) → −∞</code> ; la courbe monte de plus en plus lentement. Propriété fondamentale
        : <code>ln(a·b) = ln(a) + ln(b)</code> — le logarithme transforme les multiplications en
        additions. C'est pour ça qu'il sert à mesurer les <strong>ordres de grandeur</strong> :
        échelle de Richter (séismes), décibels (son), pH (acidité).
      </p>
    </section>
  </main>
);

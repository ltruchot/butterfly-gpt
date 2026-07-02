import type { FC } from "hono/jsx";
import type { SessionSnapshot } from "./session.ts";

// ════════════════════════════════════════════════════════════════════════
// <Inference> — démo /inference (section « Inference »), génération EN LIVE
// ════════════════════════════════════════════════════════════════════════
// Le nom s'écrit lettre par lettre : à chaque pas, le modèle prédit la lettre
// suivante, on la tire au sort (température), on la réinjecte, et le serveur
// pousse le texte mis à jour par SSE.

const busy = (p: SessionSnapshot["phase"]): boolean => p === "preparing" || p === "generating";

const phaseDescription = (s: SessionSnapshot): string => {
  if (s.phase === "idle")
    return s.prepared
      ? "Prêt — clique sur Générer pour halluciner un nouveau nom de papillon."
      : "Prêt — au premier clic, on entraîne d'abord un petit modèle (~2 s), puis on génère.";
  if (s.phase === "preparing")
    return "Préparation : entraînement express du modèle sur les papillons…";
  if (s.phase === "generating")
    return `Génération autorégressive (température ${s.temperature}) : chaque lettre est tirée puis réinjectée.`;
  return "Terminé — le modèle a produit un BOS (fin de mot) ou atteint la longueur maximale.";
};

const buttonLabel = (s: SessionSnapshot): string => {
  if (s.phase === "preparing") return "Préparation…";
  if (s.phase === "generating") return "Génération…";
  return "Générer ▶";
};

export const App: FC<{ state: SessionSnapshot }> = ({ state }) => (
  <main id="app" data-init="@get('/inference/subscribe')" data-preserve-attr="data-init">
    <header>
      <h1>13 · Inference</h1>
      <p class="graph-block-subtitle">
        Une fois entraîné, on fait GÉNÉRER le modèle : on part du token <code>BOS</code>, on prédit
        la lettre suivante, on la tire au sort selon les probabilités (réglées par la{" "}
        <strong>température</strong>), on la réinjecte, et on recommence. Voir{" "}
        <code>13-sample.ts</code>.
      </p>
    </header>

    <aside class="legend" data-testid="legend" aria-label="Légende inference">
      <div class="legend-intro">
        <h3>Autorégressif, lettre par lettre</h3>
        <ul class="legend-pipeline">
          <li>
            on démarre avec <code>BOS</code> (« début de mot ») ;
          </li>
          <li>
            passe avant → <code>softmax(scores / température)</code> → une probabilité par lettre ;
          </li>
          <li>
            on TIRE AU SORT la lettre selon ces probabilités (pas toujours la plus probable) ;
          </li>
          <li>
            si on tire <code>BOS</code> → fin du mot ; sinon on ajoute la lettre et on boucle.
          </li>
        </ul>
        <p class="legend-paragraph">
          Température &lt; 1 (ici {state.temperature}) : le modèle ose moins, noms plus « propres ».
          Plus haute : plus de fantaisie (et de fautes). Le texte apparaît{" "}
          <strong>en direct</strong> via SSE.
        </p>
      </div>
    </aside>

    <section class="graph-block" data-testid="inference-block">
      <header class="graph-block-header">
        <h2>Un nouveau nom de papillon</h2>
        <p class="graph-block-step" data-testid="phase">
          {phaseDescription(state)}
        </p>
      </header>

      <div class="sample-output" data-testid="name">
        {state.text || (busy(state.phase) ? "…" : "—")}
        {state.phase === "generating" ? <span class="sample-caret">▏</span> : null}
      </div>

      <footer class="graph-block-controls">
        <button
          type="button"
          data-testid="generate"
          data-on:click="@post('/inference/generate')"
          disabled={busy(state.phase)}
        >
          {buttonLabel(state)}
        </button>
        <button type="button" data-testid="reset" data-on:click="@post('/inference/reset')">
          ↻ Reset
        </button>
      </footer>
    </section>
  </main>
);

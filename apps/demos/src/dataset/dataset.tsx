import type { FC } from "hono/jsx";
import type { Phase, SessionSnapshot } from "./session.ts";

// ════════════════════════════════════════════════════════════════════════
// <Dataset> — composant FAT-MORPHED de la démo /dataset
// ════════════════════════════════════════════════════════════════════════
// L'attribut `data-init` ouvre la SSE long-lived sur `/dataset/subscribe`
// au premier mount. `data-preserve-attr` empêche idiomorph de l'effacer
// lors des morphs successifs.
//
// QUATRE PHASES, QUATRE BOUTONS distincts (le user a explicitement
// demandé des libellés parlants, pas un unique « Next ») :
//   initial   → [Collecter]
//   collected → [Curation/Clean]
//   cleaned   → [Mélanger + 500]
//   shuffled  → terminé (seul [↻ Reset] reste actif)

const phaseLabel = (p: Phase): string => {
  if (p === "initial") return "Prêt — clique sur Collecter pour récupérer les données brutes.";
  if (p === "collected")
    return `Données brutes (${RAW_LABEL}) — bruit visible : casse incohérente, doublons, espaces, lignes vides.`;
  if (p === "cleaned")
    return "Nettoyé — trim + lower + dedup. Pas de tri (l'ordre original est conservé).";
  return "Mélangé — `docs` du corpus complet, sélection seedée des 500 premiers (50 affichés).";
};

const RAW_LABEL = "Wikipédia FR + iNaturalist";

export const App: FC<{ state: SessionSnapshot }> = ({ state }) => (
  <main id="app" data-init="@get('/dataset/subscribe')" data-preserve-attr="data-init">
    <header>
      <h1>1 · Dataset</h1>
      <p class="graph-block-subtitle">
        Tout GPT a besoin d'un <strong>corpus</strong>. Ici : ~7 000 noms vernaculaires de papillons
        français. La démo émule la chaîne <em>collecte → curation → mélange</em>, exactement comme
        on l'enchaîne dans <code>01-dataset.ts</code>.
      </p>
      <p class="graph-block-step" data-testid="phase">
        {phaseLabel(state.phase)}
      </p>
    </header>

    <section class="graph-block" data-testid="dataset-block">
      <header class="graph-block-header">
        <h2>Pipeline</h2>
        <ul class="graph-legend-mini">
          <li>
            <strong>1. Collecter</strong> — récupérer le texte brut sur les sources publiques (ici
            simulé). Volume brut : <code data-testid="raw-count">{state.rawCount}</code> entrées.
          </li>
          <li>
            <strong>2. Curation / Clean</strong> — <code>trim</code>, <code>toLowerCase</code>,{" "}
            <code>dedup</code>, <code>filter(non-vide)</code>. <strong>Pas de tri</strong> : l'ordre
            du fichier est conservé. Après filtrage :{" "}
            <code data-testid="cleaned-count">{state.cleanedCount}</code> entrées uniques.
          </li>
          <li>
            <strong>3. Mélanger + 500</strong> — Fisher-Yates seedé (<code>SEED = 42</code>) sur le
            corpus complet, puis <code>.slice(0, 500)</code>. Sortie :{" "}
            <code data-testid="shuffled-count">{state.shuffledCount}</code> entrées prêtes pour le
            tokenizer.
          </li>
        </ul>
      </header>

      <pre class="legend-snapshot" data-testid="entries">
        {state.visible.length === 0
          ? "// (clique sur Collecter pour démarrer)"
          : state.visible
              .map((line, i) => `${i.toString().padStart(3, " ")}  ${line || "(vide)"}\n`)
              .join("")}
      </pre>

      <footer class="graph-block-controls">
        <button
          type="button"
          data-testid="collect"
          data-on:click="@post('/dataset/collect')"
          disabled={state.phase !== "initial"}
        >
          1 · Collecter
        </button>
        <button
          type="button"
          data-testid="clean"
          data-on:click="@post('/dataset/clean')"
          disabled={state.phase !== "collected"}
        >
          2 · Curation / Clean
        </button>
        <button
          type="button"
          data-testid="shuffle"
          data-on:click="@post('/dataset/shuffle')"
          disabled={state.phase !== "cleaned"}
        >
          3 · Mélanger + 500
        </button>
        <button type="button" data-testid="reset" data-on:click="@post('/dataset/reset')">
          ↻ Reset
        </button>
      </footer>
    </section>
  </main>
);

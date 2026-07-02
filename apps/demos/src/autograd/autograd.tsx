import { raw } from "hono/html";
import type { FC } from "hono/jsx";
import { highlight } from "../views/highlight.ts";
import { ICON_ID } from "../views/IconsSprite.tsx";
import { AZUR_SVG } from "./azurPlan.ts";
import type { SessionSnapshot } from "./session.ts";

const LegendIcon: FC<{ id: string }> = ({ id }) => (
  <svg class="legend-icon" viewBox="0 0 24 24" aria-hidden="true">
    <use href={`#${id}`} />
  </svg>
);

// Snapshot de la STRUCTURE manipulée par l'autograd au démarrage (avant
// tout clic). 5 nœuds reliés, feuilles déjà initialisées, nœuds internes
// encore vides côté `data` / `grad`. C'est le pont entre la description
// abstraite « DAG » et ce que le code stocke vraiment en mémoire.
const GRAPH_SNAPSHOT = `// Structure manipulée par l'autograd au démarrage.
// 5 nœuds reliés. Chaque nœud = objet { data, grad } (+ liens vers parents).

const graph = {
  tok_emb : { data:  2,        grad: undefined,                              role: "1 case de tokenEmb (parameter)" },
  pos_emb : { data: -3,        grad: undefined,                              role: "1 case de positionEmb (parameter)" },
  x       : { data: undefined, grad: undefined, parents: [tok_emb, pos_emb], role: "tok_emb + pos_emb" },
  w       : { data: -4,        grad: undefined,                              role: "1 case de outputProj (parameter)" },
  L       : { data: undefined, grad: undefined, parents: [w, x],             role: "w · x — score pour UN candidat" },
};

// Passe AVANT   → calcule x.data = -1, puis L.data = 4.
// Passe ARRIÈRE → initialise L.grad = 1, puis propage :
//                  w.grad = -1, x.grad = -4, tok_emb.grad = -4, pos_emb.grad = -4.`;

// <App> — composant FAT-MORPHED à chaque step. L'attribut `data-init` ouvre
// la SSE long-lived au premier mount ; idiomorph préserve l'attribut entre
// morphs grâce à `data-preserve-attr`.

export const App: FC<{ state: SessionSnapshot }> = ({ state }) => (
  <main id="app" data-init="@get('/autograd/subscribe')" data-preserve-attr="data-init">
    <header>
      <h1>3 · Autograd</h1>
      <p class="graph-block-subtitle">
        Une fonction classique prend des entrées, calcule, renvoie un résultat — et oublie tout le
        reste. <strong>L'autograd, lui, prend note de chaque calcul intermédiaire</strong> sous
        forme d'un graphe : un arbre de nœuds reliés par des opérations (+, ×, …). Cette structure
        (un <strong>DAG</strong> — graphe orienté acyclique) sait <em>s'autoévaluer</em> dans les
        deux sens : vers l'avant pour calculer le résultat (la <em>passe avant</em>), et vers
        l'arrière pour dire, <strong>pour chaque nœud-feuille</strong>, de combien il faudrait le
        pousser pour faire varier ce résultat (la <em>passe arrière</em>, <code>backward</code>).
      </p>
    </header>

    <aside class="legend" data-testid="legend" aria-label="Légende autograd">
      <div class="legend-intro">
        <h3>D'où viennent les nœuds-feuilles ?</h3>
        <p class="legend-paragraph">
          Deux sources, deux sémantiques. C'est l'étape suivante (
          <a href="/parameters">4 · Parameters</a>) qui détaille la première ; ici on retient juste
          que :
        </p>
        <ul class="legend-pipeline">
          <li>
            <strong>Les paramètres du modèle</strong> sont, concrètement,{" "}
            <strong>des matrices de nœuds-feuilles</strong>. Chaque case d'une matrice (
            <code>tokenEmb</code>, <code>positionEmb</code>, <code>outputProj</code>…) est un Node
            que la passe arrière fera évoluer.
          </li>
          <li>
            <strong>Les inputs</strong> sont aussi des nœuds-feuilles, mais{" "}
            <strong>constants</strong>. Par exemple, pour apprendre le nom <em>azur</em>, on fournit
            la séquence d'ids des lettres : <code>[a, z, u, r]</code>. On ne cherche pas à les
            modifier — on cherche juste comment les <em>paramètres</em> doivent s'adapter à eux.
          </li>
        </ul>
        <p class="legend-paragraph">
          Pour entraîner : on construit le graphe (passe avant) à partir des paramètres et d'un
          input, on regarde la <em>loss</em> au sommet, on appelle <code>backward(loss)</code>, et
          on garde uniquement les gradients qui correspondent aux paramètres pour les bouger (cf.{" "}
          <code>step()</code> à l'étape 4).
        </p>
      </div>

      <div class="legend-intro">
        <h3>
          La fonction <code>backward(racine) → Map&lt;Nœud, gradient&gt;</code>
        </h3>
        <p class="legend-paragraph">
          C'est <strong>LA</strong> fonction de l'autograd. On lui donne le nœud-racine (la{" "}
          <code>loss</code>, un seul nombre tout en haut du graphe), elle renvoie pour{" "}
          <strong>chaque feuille</strong> sa dérivée <code>∂racine/∂feuille</code> — un nombre qui
          répond à la question : « si je pousse cette feuille de +1, de combien la racine
          bouge-t-elle ? ». L'optimiseur n'a plus qu'à utiliser ces nombres pour faire évoluer les
          paramètres dans la bonne direction.
        </p>
      </div>

      <p class="legend-snapshot-caption">
        <strong>La structure manipulée</strong> — 5 nœuds pour le neurone-jouet du graphe 1, ~100
        nœuds pour le graphe complet d'<em>azur</em> du graphe 2 :
      </p>
      <pre class="legend-snapshot" data-testid="legend-snapshot">
        <code>{raw(highlight(GRAPH_SNAPSHOT))}</code>
      </pre>

      <div class="legend-item">
        <LegendIcon id={ICON_ID.leaf} />
        <code>nœud-feuille</code>
        <span>
          Un nœud sans parents — soit un paramètre, soit un input. C'est uniquement sur ces feuilles
          que <code>backward</code> renvoie un gradient.
        </span>
      </div>

      <div class="legend-item">
        <LegendIcon id={ICON_ID.data} />
        <code>data</code>
        <span>
          Champ « valeur courante » du nœud, rempli pendant la passe AVANT en composant les{" "}
          <code>data</code> des parents par l'opération du nœud.
        </span>
      </div>

      <div class="legend-item">
        <LegendIcon id={ICON_ID.grad} />
        <code>grad</code>
        <span>
          Champ « dérivée <code>∂racine/∂nœud</code> », rempli pendant la passe ARRIÈRE. Sur un
          nœud-paramètre, c'est la valeur que <code>step()</code> utilise. Sur un nœud-input, on
          l'ignore (les inputs sont constants).
        </span>
      </div>
    </aside>

    {/* ── Bloc 1 : neurone unique step-by-step ─────────────────────── */}
    <section class="graph-block" data-testid="graph1-block">
      <header class="graph-block-header">
        <h2>
          1. Le mini-neurone : <code>L = w · (tok_emb + pos_emb)</code>
        </h2>
        <p class="graph-block-subtitle">
          5 nœuds, 2 opérations. Les feuilles sont hardcodées en scalaires entiers pour rester
          lisibles dans le SVG. Cliquer sur Next fait avancer la passe avant (un nœud à la fois)
          puis la passe arrière (un arc à la fois).
        </p>
        <p class="graph-block-step" data-testid="phase">
          {state.phaseText}
          <span class="step-counter" data-testid="counter">
            {" — Étape "}
            {state.stepIndex} / {state.totalSteps}
          </span>
        </p>
      </header>
      <div class="graph" data-testid="graph">
        {raw(state.svg)}
      </div>
      <footer class="graph-block-controls">
        <button
          type="button"
          data-testid="next"
          data-on:click="@post('/autograd/next')"
          disabled={state.done}
        >
          Next →
        </button>
        <button type="button" data-testid="reset" data-on:click="@post('/autograd/reset')">
          ↻ Reset
        </button>
      </footer>
    </section>

    {/* ── Bloc 2 : graphe complet « azur » (statique) ──────────────── */}
    <section class="graph-block" data-testid="graph2-block">
      <header class="graph-block-header">
        <h2>
          2. Le graphe complet d'<em>azur</em> — apprendre une séquence
        </h2>
        <p class="graph-block-subtitle">
          Pour apprendre le nom « azur », on pose en réalité <strong>3 mini-questions</strong>{" "}
          (autant que de transitions entre lettres). Chacune construit son sous-arbre d'autograd ;
          la perte totale (somme des 3 pertes) est la <strong>racine</strong> du graphe complet.
          Backward distribue ensuite le « blâme » : chaque paramètre reçoit une dose proportionnelle
          à sa responsabilité dans l'erreur.
        </p>
        <ol class="graph-questions">
          <li>
            Sachant <code>a</code>, quelle lettre vient ensuite ? Vraie réponse : <code>z</code> →
            sous-arbre <code>loss_a→z</code>.
          </li>
          <li>
            Sachant <code>z</code>, vraie réponse <code>u</code> → sous-arbre <code>loss_z→u</code>.
          </li>
          <li>
            Sachant <code>u</code>, vraie réponse <code>r</code> → sous-arbre <code>loss_u→r</code>.
          </li>
        </ol>
        <p class="graph-block-subtitle">
          Comment lire les noms des nœuds (les matrices <code>tokenEmb</code> /{" "}
          <code>positionEmb</code> / <code>outputProj</code> sont expliquées à{" "}
          <a href="/parameters">4 · Parameters</a>) :
        </p>
        <ul class="graph-legend-mini">
          <li>
            <code>tokenEmb[lettre][i]</code> — un nombre tiré de la matrice de paramètres{" "}
            <code>tokenEmb</code>, à la ligne « lettre » et colonne <code>i</code>.
          </li>
          <li>
            <code>positionEmb[p][i]</code>, <code>outputProj[c,i]</code> — idem pour les autres
            matrices.
          </li>
          <li>
            <code>x[i]_X→Y</code> = <code>tokenEmb[X][i] + positionEmb[pos][i]</code> : l'embedding
            combiné lettre + position. Première vraie opération du modèle.
          </li>
          <li>
            Le suffixe <code>_X→Y</code> sur un nœud intermédiaire indique à quelle question il
            participe (<code>X</code> = lettre d'entrée, <code>Y</code> = vraie réponse).
          </li>
          <li>
            <code>loss_X→Y</code> = perte d'une question. <code>LOSS</code> = somme des trois ={" "}
            racine de tout le graphe.
          </li>
        </ul>
      </header>
      <div class="graph graph--azur" data-testid="graph-azur">
        {raw(AZUR_SVG)}
      </div>
    </section>
  </main>
);

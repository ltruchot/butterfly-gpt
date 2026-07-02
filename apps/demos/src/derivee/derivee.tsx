import { raw } from "hono/html";
import type { FC } from "hono/jsx";
import { ETA_MAX, ETA_MIN, f, fPrime, type SessionSnapshot, W_MAX, W_MIN } from "./session.ts";

// ════════════════════════════════════════════════════════════════════════
// <Derivee> — interlude math « ∂ » : la dérivée, le skieur dans le brouillard
// ════════════════════════════════════════════════════════════════════════
// Porté depuis apps/math/src/main.ts (page Vite vanilla). Le texte est repris
// tel quel ; ce qui était impératif (spans data-live-*, requestAnimationFrame)
// devient un rendu SERVEUR de l'état courant : chaque pas arrive en morph SSE,
// il n'y a plus d'animation easing — le déplacement EST le morph.

// ── Géométrie de la scène SVG (mêmes valeurs que la page d'origine) ──────
const VIEW_W = 640;
const VIEW_H = 360;
const PAD_L = 50;
const PAD_R = 30;
const PAD_T = 30;
const PAD_B = 50;
const A_MIN = 0; // altitude min/max affichée
const A_MAX = 9;
const FOG_R = 95; // rayon de la trouée dans le brouillard
const ARROW_CAP_PX = 220; // longueur max de la flèche du prochain pas

const wToX = (w: number): number =>
  PAD_L + ((w - W_MIN) / (W_MAX - W_MIN)) * (VIEW_W - PAD_L - PAD_R);
const aToY = (a: number): number =>
  VIEW_H - PAD_B - ((a - A_MIN) / (A_MAX - A_MIN)) * (VIEW_H - PAD_T - PAD_B);

// Conversion pente mathématique → pente en pixels (l'axe y SVG descend).
const dxPerW = (VIEW_W - PAD_L - PAD_R) / (W_MAX - W_MIN);
const dyPerA = -(VIEW_H - PAD_T - PAD_B) / (A_MAX - A_MIN);

// Formatage fr-FR local à la page (VIRGULE décimale : « 1,00 », « −2,40 »).
// views/fmt.ts fait toFixed(3) avec un POINT — ici les nombres sont lus dans
// un texte pédagogique français validé, on garde donc le format d'origine.
const fmtFr = (n: number, dec = 2): string =>
  n.toLocaleString("fr-FR", { maximumFractionDigits: dec, minimumFractionDigits: dec });
// Signe explicite (le « + » devant un déplacement positif fait partie du cours).
const signed = (n: number, dec = 2): string => (n >= 0 ? "+" : "") + fmtFr(n, dec);

// La courbe de la piste ne dépend pas de l'état : précalculée une fois.
const curvePath = ((): string => {
  const pts: string[] = [];
  for (let i = 0; i <= 240; i++) {
    const w = W_MIN + (i / 240) * (W_MAX - W_MIN);
    pts.push(`${i === 0 ? "M" : "L"}${wToX(w).toFixed(1)},${aToY(f(w)).toFixed(1)}`);
  }
  return pts.join(" ");
})();

// ── La scène : paysage brumeux + skieur, rendue SERVEUR à chaque morph ───
// Mêmes maths que le render() de la page d'origine : position, angle des
// skis selon la pente (en pixels), flèche du prochain pas plafonnée, trouée
// de brouillard centrée sur le skieur, trace des positions visitées.
const buildScene = (s: SessionSnapshot): string => {
  const x = wToX(s.w);
  const y = aToY(f(s.w));
  const slope = fPrime(s.w);
  const pxSlope = (dyPerA * slope) / dxPerW;
  const angleDeg = (Math.atan2(pxSlope, 1) * 180) / Math.PI;

  const stepDx = -s.eta * slope * dxPerW;
  const stepDy = stepDx * pxSlope;
  const stepMag = Math.hypot(stepDx, stepDy);
  const scale = stepMag === 0 ? 0 : Math.min(1, ARROW_CAP_PX / stepMag);
  const endX = x + stepDx * scale;
  const endY = y + stepDy * scale;
  const arrowOpacity = stepMag < 0.5 ? "0" : "0.85";

  const trailAll = s.trail.length === 0 ? [] : [...s.trail, s.w];
  const trackPts = trailAll
    .map((tw) => `${wToX(tw).toFixed(1)},${aToY(f(tw)).toFixed(1)}`)
    .join(" ");

  return `
<svg viewBox="0 0 ${VIEW_W} ${VIEW_H}" aria-label="paysage brumeux avec un skieur">
  <defs>
    <radialGradient id="fog-fade">
      <stop offset="0%" stop-color="white"/>
      <stop offset="65%" stop-color="white"/>
      <stop offset="100%" stop-color="black"/>
    </radialGradient>
    <mask id="window">
      <rect width="100%" height="100%" fill="black"/>
      <circle id="window-disk" cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${FOG_R}" fill="url(#fog-fade)"/>
    </mask>
    <marker id="arrow-head" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M0,0 L10,5 L0,10 z"/>
    </marker>
  </defs>

  <line class="ground" x1="${PAD_L}" y1="${aToY(0)}" x2="${VIEW_W - PAD_R}" y2="${aToY(0)}"/>

  <path id="curve-revealed" class="curve-revealed" d="${curvePath}"/>

  <g mask="url(#window)">
    <path class="curve-bright" d="${curvePath}"/>
  </g>

  <g id="trail">
    <polyline id="track" class="track" points="${trackPts}"/>
  </g>

  <line id="next-step" class="next-step" x1="${x.toFixed(2)}" y1="${y.toFixed(2)}"
        x2="${endX.toFixed(2)}" y2="${endY.toFixed(2)}" opacity="${arrowOpacity}"
        marker-end="url(#arrow-head)"/>

  <g id="skier-pos" class="skier-figure" transform="translate(${x.toFixed(2)}, ${y.toFixed(2)})">
    <g id="skis-rot" transform="rotate(${angleDeg.toFixed(2)})">
      <line class="skis" x1="-32" y1="0" x2="32" y2="0"/>
      <line class="ski-tip" x1="32" y1="0" x2="34" y2="-2"/>
    </g>
    <line class="skier-leg" x1="-4" y1="0" x2="0" y2="-12"/>
    <line class="skier-leg" x1="4" y1="0" x2="0" y2="-12"/>
    <line class="skier-body" x1="0" y1="-12" x2="0" y2="-30"/>
    <circle class="skier-head" cx="0" cy="-37" r="7"/>
  </g>

  <text class="axis-label" x="${PAD_L - 8}" y="${PAD_T - 8}" text-anchor="start">↑ altitude</text>
  <text class="axis-label" x="${VIEW_W - PAD_R}" y="${VIEW_H - 12}" text-anchor="end">position w →</text>
</svg>`;
};

export const App: FC<{ state: SessionSnapshot }> = ({ state }) => {
  const slope = fPrime(state.w);
  const stepSize = -state.eta * slope;
  const absSlope = Math.abs(slope);
  const arrived = absSlope < 0.05;
  const close = !arrived && absSlope < 0.4;
  const statusText = arrived
    ? "✓ ARRIVÉ — la pente est nulle, le pas l'est aussi : le skieur est dans la vallée"
    : close
      ? "↓ on approche : la pente faiblit, donc le pas rétrécit (c'est voulu, pas un bug)"
      : "";
  const statusClass = arrived ? "status arrived" : close ? "status close" : "status";

  return (
    <main
      id="app"
      class="derivee"
      data-init="@get('/derivee/subscribe')"
      data-preserve-attr="data-init"
    >
      <style>{raw(PAGE_CSS)}</style>

      <header class="page-header" id="derivee-header">
        <h1>La dérivée</h1>
        <p class="page-tagline">
          Un nombre qui dit <em>« à quelle vitesse une fonction varie »</em>. On va d'abord voir ce
          que c'est sur le grand classique des maths. Puis on l'utilisera dans une situation où elle
          est vitale : aider un skieur perdu dans le brouillard à trouver la vallée.
        </p>
      </header>

      <section class="warmup" id="warmup">
        <h2>
          1) Le cas ultra-simple : <code>f(x) = x²</code>
        </h2>

        <p>
          Le grand classique des maths : la fonction <code>f(x) = x²</code> (« x au carré »). Sa
          courbe est une parabole, qui monte vite à droite et symétriquement à gauche. Plus on
          s'éloigne de zéro, plus elle est pentue.
        </p>

        <p>
          Pour calculer la dérivée, on part de la <strong>formule officielle</strong> (qu'on
          décortique plus bas dans la carte 2) :
        </p>

        <p class="centered-formula">
          <code>
            f'(x) = lim<sub>h→0</sub> [ f(x+h) − f(x) ] / h
          </code>
        </p>

        <p>
          <em>
            lim<sub>h→0</sub>
          </em>{" "}
          veut dire{" "}
          <em>« on rétrécit h jusqu'à zéro et on regarde vers quelle valeur le calcul tend »</em>.
          Concrètement : on simplifie d'abord l'expression entre crochets, puis à la toute fin on
          remplace <em>h</em> par <em>0</em>. On part donc juste de l'expression{" "}
          <code>[ f(x+h) − f(x) ] / h</code> :
        </p>

        <div class="derivation-steps">
          <div class="step">
            <span class="step-label">
              Étape 1 — on remplace <em>f</em> par <em>x²</em> :
            </span>
            <code class="step-eq">[ (x+h)² − x² ] / h</code>
          </div>
          <div class="step">
            <span class="step-label">Étape 2 — on développe (x+h)² = x² + 2xh + h² :</span>
            <code class="step-eq">[ x² + 2xh + h² − x² ] / h</code>
          </div>
          <div class="step">
            <span class="step-label">
              Étape 3 — les deux <em>x²</em> s'annulent :
            </span>
            <code class="step-eq">[ 2xh + h² ] / h</code>
          </div>
          <div class="step">
            <span class="step-label">
              Étape 4 — on factorise <em>h</em> dans le numérateur :
            </span>
            <code class="step-eq">[ h · (2x + h) ] / h</code>
          </div>
          <div class="step">
            <span class="step-label">
              Étape 5 — on simplifie <em>h / h = 1</em> :
            </span>
            <code class="step-eq">2x + h</code>
          </div>
          <div class="step">
            <span class="step-label">
              Étape 6 — on fait tendre <em>h</em> vers zéro (donc on remplace <em>h</em> par{" "}
              <em>0</em>) :
            </span>
            <code class="step-eq">
              2x + 0 = <strong>2x</strong>
            </code>
          </div>
        </div>

        <p>
          Donc <code>f'(x) = 2x</code>. C'est démontré. À partir de cette formule, la pente devient{" "}
          <strong>totalement prédictible</strong> en n'importe quel point :
        </p>

        <table class="warmup-table">
          <thead>
            <tr>
              <th>x</th>
              <th>f(x) = x²</th>
              <th>{"f'(x) = 2x  =  la pente"}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>0</td>
              <td>0</td>
              <td>
                <strong>0</strong> {" "}(terrain plat)
              </td>
            </tr>
            <tr>
              <td>1</td>
              <td>1</td>
              <td>
                <strong>2</strong>
              </td>
            </tr>
            <tr>
              <td>2</td>
              <td>4</td>
              <td>
                <strong>4</strong>
              </td>
            </tr>
            <tr>
              <td>5</td>
              <td>25</td>
              <td>
                <strong>10</strong>
              </td>
            </tr>
            <tr>
              <td>10</td>
              <td>100</td>
              <td>
                <strong>20</strong>
              </td>
            </tr>
            <tr>
              <td>100</td>
              <td>10 000</td>
              <td>
                <strong>200</strong> {" "}(quasi-vertical)
              </td>
            </tr>
          </tbody>
        </table>

        <p>
          Une seule formule (<code>2x</code>) résume la pente partout. Pas besoin de mesurer, pas
          besoin de tâtonner avec un <em>h</em> petit ou grand : on remplace <em>x</em> dans{" "}
          <em>2x</em>, point.
        </p>

        <p>
          <strong>Cette formule est une boussole magique des maths.</strong> On peut l'appliquer à{" "}
          <em>n'importe quelle fonction</em> pour prédire la pente — et donc ce qui se passe juste à
          côté du point courant. Mais son utilité dépend complètement de la <em>tête</em> de la
          fonction :
        </p>
        <ul class="usefulness">
          <li>
            <strong>Fonction linéaire</strong> (une droite, du type <code>f(x) = 2x + 5</code>) : la
            dérivée est constante, et la prédiction est <em>exacte</em>. Tu peux extrapoler aussi
            loin que tu veux, c'est juste.
          </li>
          <li>
            <strong>Courbe douce</strong> (comme <em>x²</em>, ou la piste du skieur plus bas) :
            prédiction très bonne juste à côté, de moins en moins bonne quand on s'éloigne.{" "}
            <em>Approximation locale fiable.</em>
          </li>
          <li>
            <strong>Fonction chaotique ou avec des sauts</strong> — par exemple{" "}
            <code>f(x) = 1 partout, sauf en x = 10 où f(x) = 1000</code> : la dérivée vaut{" "}
            <em>0</em> presque partout (la fonction est plate localement). Elle te dit « tout est
            plat ! », alors qu'il y a un pic gigantesque à x = 10. Ici elle est{" "}
            <strong>inutile, voire carrément trompeuse</strong>.
          </li>
        </ul>
        <p>
          Règle du pouce : la dérivée est précieuse quand la fonction est <em>lisse</em> (continue,
          sans saut, sans coin). C'est précisément pour ça qu'en IA, on <em>fabrique</em> les
          fonctions d'erreur pour qu'elles soient bien lisses — sans ça, la dérivée ne pourrait pas
          guider l'apprentissage.
        </p>

        <p>
          <strong>Pourquoi l'ordinateur adore ça.</strong> Sans la formule de la dérivée, pour
          connaître la pente, il faudrait calculer <code>(f(x+h) − f(x)) ÷ h</code> avec un{" "}
          <em>h</em> très petit — donc <em>deux évaluations</em> de la fonction, une soustraction,
          une division, et une approximation. Avec <code>2x</code>, c'est{" "}
          <em>une seule multiplication exacte</em>. Sur les milliards de paramètres d'un modèle
          d'IA, cette différence sépare le <em>faisable</em> de l'<em>impossible</em>.
        </p>

        <p class="transition">
          Sur ce cas tout simple, on ne voit pas vraiment <em>à quoi sert</em> la pente. Pour ça, il
          faut une situation où on en a vitalement besoin — où on est aveugle, et où elle devient
          notre seule boussole.
        </p>
      </section>

      <section class="demo" id="demo-intro">
        <h2>2) Une vraie application : le skieur dans le brouillard</h2>
        <p class="lead">
          Un skieur veut atteindre le bas de la piste. Le brouillard est si épais qu'il ne{" "}
          <em>voit</em> rien. Mais sous ses skis, il <strong>sent</strong> la{" "}
          <strong>force de la pente</strong> : très raide (piste noire), moins raide (rouge), douce
          (bleue), presque plate (verte). Et il sent sa <strong>vitesse</strong> qui s'emballe ou
          ralentit. Ces sensations corporelles, c'est <em>exactement</em> ce que les maths appellent
          la <strong>dérivée</strong> appliquée à l'altitude. Le skieur la ressent dans son corps,
          sans calcul. Avec ça, il décide son sens et la taille de son pas. Puis il sent la nouvelle
          pente, refait un pas. Il finit dans la vallée <em>sans avoir jamais vu la piste</em>.
        </p>
      </section>

      <section class="formulas" id="formulas">
        <article class="formula">
          <span class="f-label">L'altitude de la piste</span>
          <code>altitude(w) = 0,3 · (w − 5)² + 0,5</code>
          <p class="f-hint w-note">
            <em>w</em> = la position du skieur, de gauche à droite (c'est juste l'étiquette de notre
            variable). Pourquoi cette lettre précise plutôt qu'une autre : c'est expliqué dans la
            note IA en bas de page — pour l'instant, considère <em>w</em> comme un simple nom.
          </p>
          <p class="f-hint">
            Forme : <strong>parabole</strong> — cuvette lisse à <em>un seul</em> fond. Choisie parce
            que (a) il y a un objectif clair (le fond), (b) plus on s'en éloigne, plus la pente est
            forte — donc la dérivée nous prévient toute seule quand on approche. C'est aussi la
            forme <em>réelle</em> de l'erreur dans plein de vrais problèmes (moindres carrés,
            ressorts, équilibres).
          </p>
        </article>

        <article class="formula">
          <span class="f-label">La pente = dérivée de l'altitude</span>

          <p class="f-hint">
            <strong>D'abord, les notations</strong> qu'on va voir apparaître :
          </p>
          <ul class="derivation">
            <li>
              <em>f</em> = une fonction (n'importe laquelle).
            </li>
            <li>
              <em>f'</em> (lire <strong>« f prime »</strong>) = la <em>dérivée</em> de <em>f</em>.
              Le petit prime <em>'</em> est une notation inventée par Lagrange en 1797. C'est{" "}
              <strong>une nouvelle fonction</strong> qui donne la pente de <em>f</em> en chaque
              point.
            </li>
            <li>
              <em>lim</em> = abréviation de <strong>« limite »</strong>. La valeur vers laquelle
              quelque chose s'approche.
            </li>
            <li>
              <em>h → 0</em> se lit <strong>« h tend vers zéro »</strong>. On rétrécit <em>h</em>{" "}
              indéfiniment, sans jamais l'atteindre tout à fait.
            </li>
          </ul>

          <p class="f-hint">
            <strong>1) Formule pure de la dérivée</strong>, vraie pour <em>n'importe quelle</em>{" "}
            fonction <em>f</em> :
          </p>
          <div class="def-formula">
            <span class="def-lhs">f'(x) =</span>
            <span class="def-lim">
              lim<sub>h → 0</sub>
            </span>
            <span class="frac">
              <span class="num">f(x + h) − f(x)</span>
              <span class="denom">h</span>
            </span>
          </div>
          <p class="f-hint">
            Décortiquée : on prend deux points proches <em>x</em> et <em>x+h</em>, on calcule la
            pente du mini-triangle entre eux (<em>(f(x+h) − f(x)) ÷ h</em>, c'est juste « hauteur ÷
            base »), puis on rétrécit <em>h</em> jusqu'à zéro. La valeur limite, c'est{" "}
            <em>f'(x)</em>.
          </p>

          <p class="f-hint">
            <strong>Pourquoi un h qui rétrécit, plutôt qu'un h fixe (genre 0,001) ?</strong> Avec un{" "}
            <em>h</em> fixe on aurait juste une <em>approximation</em>, et le résultat dépendrait du
            choix de <em>h</em> :
          </p>
          <ul class="derivation">
            <li>
              <em>h = 1</em> → grand triangle, pente très approximative
            </li>
            <li>
              <em>h = 0,1</em> → mieux, mais encore faux
            </li>
            <li>
              <em>h = 0,001</em> → encore mieux, mais toujours pas exact
            </li>
            <li>
              <em>h → 0</em> → toutes ces approximations{" "}
              <strong>convergent vers une même valeur</strong>. C'est cette valeur qu'on appelle la
              dérivée.
            </li>
          </ul>
          <p class="f-hint">
            C'est exactement ce qui répond à ton intuition :{" "}
            <em>« on peut faire dire ce qu'on veut avec un gros h »</em>. Oui ! C'est pour ça qu'on
            rétrécit <em>h</em> à zéro : la limite est la <strong>seule</strong> valeur qui ne
            dépend plus du choix de <em>h</em>. Pas tâtonnante, objective.
          </p>

          <p class="f-hint">
            <strong>2) Appliquée à notre piste</strong> : <em>f</em> devient <em>altitude</em>,{" "}
            <em>x</em> devient <em>w</em>. Substitution mécanique dans la formule pure :
          </p>
          <div class="def-formula">
            <span class="def-lhs">altitude'(w) =</span>
            <span class="def-lim">
              lim<sub>h → 0</sub>
            </span>
            <span class="frac">
              <span class="num">altitude(w + h) − altitude(w)</span>
              <span class="denom">h</span>
            </span>
          </div>
          <p class="f-hint">
            En remplaçant <em>altitude</em> par sa formule (<code>0,3·(...)² + 0,5</code>), on
            obtient une expression algébrique. Après simplification et limite, ça donne{" "}
            <code>0,6 · (w − 5)</code>. Mécanique mais lourd.
          </p>

          <p class="f-hint">
            <strong>3) Raccourci</strong> — des règles toutes faites, prouvées une fois pour toutes
            à partir de la définition (1), donnent directement le résultat terme par terme, sans
            refaire la limite :
          </p>
          <ul class="derivation">
            <li>
              la constante <em>+ 0,5</em> dérive en <em>0</em>
            </li>
            <li>
              le carré <em>(w − 5)²</em> dérive en <em>2 · (w − 5)</em>
            </li>
            <li>
              le facteur <em>0,3</em> reste tel quel (multiplication par constante)
            </li>
          </ul>
          <p class="f-hint">
            On rassemble : <code>0,3 · 2 · (w − 5) + 0</code>, donc :
          </p>
          <code>altitude'(w) = 0,6 · (w − 5)</code>
          <p class="f-hint">
            C'est une <strong>nouvelle fonction</strong>, valable pour <em>tout</em> w — pas un
            nombre.
          </p>
        </article>

        <article class="formula formula-live">
          <span class="f-label">
            Application <em>ici</em> (au point courant)
          </span>
          <div class="eta-note">
            <p>
              <strong>η</strong> (« êta », lettre grecque) = la <strong>taille du pas</strong> qu'on
              se donne (le slider plus bas). C'est <em>nous</em> qui le choisissons, pas la math.
            </p>
            <p>
              <strong>η n'apparaît PAS dans la formule de la dérivée.</strong> La dérivée, c'est
              juste <code>f'(w)</code> — elle nous donne la pente, rien d'autre. Pas de η là-dedans.
            </p>
            <p>
              η apparaît seulement quand on veut <em>utiliser</em> cette pente pour <em>bouger</em>.
              C'est l'algorithme qu'on appelle <strong>descente de gradient</strong> qui dit :{" "}
              <code>
                w<sub>nouveau</sub> = w − η · f'(w)
              </code>
              . La dérivée donne la <em>direction</em> ; η donne la <em>distance</em> qu'on accepte
              de franchir.
            </p>
            <p>
              <strong>η ≠ h.</strong> <em>h</em> est l'infinitésimal de la définition mathématique
              (tend vers zéro, jamais réglé à la main). <em>η</em> est un nombre fini, typiquement
              entre 0 et 1, qu'on règle à l'œil. Deux concepts totalement différents qui se baladent
              près de la dérivée pour des raisons différentes.
            </p>
          </div>
          {/* Le calcul LIVE : rendu serveur depuis l'état courant — chaque
              morph SSE le remet à jour (plus de spans data-live-* impératifs). */}
          <div class="live-calc" id="live-calc">
            <div class="live-row">
              <span class="live-prefix">pente :</span>
              <span class="live-expr">0,6 · ({fmtFr(state.w)} − 5)</span>
              <span class="live-eq">=</span>
              <span class="live-val">{signed(slope)}</span>
            </div>
            <div class="live-row">
              <span class="live-prefix">déplacement :</span>
              <span class="live-expr">
                −η · pente = −{fmtFr(state.eta)} · ({signed(slope)})
              </span>
              <span class="live-eq">=</span>
              <span class="live-val good">{signed(stepSize, 3)}</span>
            </div>
            <div class="live-row">
              <span class="live-prefix">
                <em>w</em> nouveau :
              </span>
              <span class="live-expr">
                {fmtFr(state.w)} + ({signed(stepSize, 3)})
              </span>
              <span class="live-eq">=</span>
              <span class="live-val good">{fmtFr(state.w + stepSize)}</span>
            </div>
          </div>
          <p class="f-hint">
            La pente est mesurée <em>maintenant</em>, là où le skieur est posé. Le déplacement est
            notre <em>décision</em> à partir de cette mesure : sens opposé à la pente, longueur
            amplifiée par η.
          </p>
        </article>
      </section>

      <figure class="scene" id="scene" data-testid="scene">
        {raw(buildScene(state))}

        <figcaption class="readout" id="readout">
          <div class="row">
            <span class="k">
              position <em>w</em>
            </span>
            <span class="v" data-testid="readout-w">
              {fmtFr(state.w)}
            </span>
          </div>
          <div class="row">
            <span class="k">altitude</span>
            <span class="v">{fmtFr(f(state.w))}</span>
          </div>
          <div class="row pente">
            <span class="k">pente sous les skis</span>
            <span class="v" data-testid="readout-slope">
              {signed(slope)}
            </span>
          </div>
          <div class={`row step${arrived ? " muted" : ""}`}>
            <span class="k">déplacement à venir</span>
            <span class="v">{signed(stepSize, 3)}</span>
          </div>
        </figcaption>
        <div class={statusClass} id="status" data-testid="status">
          {statusText}
        </div>
      </figure>

      <div class="controls" id="controls">
        <label class="slider">
          <span class="slider-label">
            taille du pas <em>η</em> = <output id="eta-out">{fmtFr(state.eta)}</output>
          </span>
          {/* data-bind:eta (forme-clé SEULE) crée le signal $eta depuis la
              valeur de l'input ; le POST /derivee/eta le renvoie au serveur,
              qui reste la source de vérité et re-broadcast. L'attribut value
              garde le POINT décimal (syntaxe HTML), seul l'affichage est fr.
              NB : le modifier « .150ms » n'est pas un nom d'attribut JSX
              valide (point interdit), d'où le spread à clé littérale. */}
          <input
            type="range"
            id="eta-slider"
            min={String(ETA_MIN)}
            max={String(ETA_MAX)}
            step="0.01"
            value={String(state.eta)}
            data-bind:eta=""
            {...{ "data-on:input__debounce.150ms": "@post('/derivee/eta')" }}
          />
          <span class="hint">trop petit : il rampe — trop grand : il dépasse et oscille</span>
        </label>
        <div class="buttons">
          <button
            id="step-btn"
            type="button"
            data-testid="step-once"
            data-on:click="@post('/derivee/step')"
          >
            ↘ un pas
          </button>
          <button
            id="auto-btn"
            type="button"
            data-testid="auto"
            data-on:click="@post('/derivee/auto')"
          >
            {state.auto ? "■ stop" : "▶ descendre tout seul"}
          </button>
          <button
            id="reset-btn"
            type="button"
            class="ghost"
            data-testid="reset"
            data-on:click="@post('/derivee/reset')"
          >
            ↺ replacer
          </button>
        </div>
      </div>

      <footer id="derivee-footer">
        <h2>
          À quoi ça sert <em>concrètement</em>, de connaître la dérivée en un point ?
        </h2>
        <p>
          Quand tu connais <em>f'(w)</em>, tu sais deux choses d'un coup à propos de ce point précis
          :
        </p>
        <ul>
          <li>
            son <strong>signe</strong> indique dans quel sens la fonction <em>monte</em> autour de
            toi (donc dans quel sens elle <em>descend</em> : l'opposé) ;
          </li>
          <li>
            sa <strong>valeur absolue</strong> indique <em>à quelle vitesse</em> elle monte ou
            descend — un grand chiffre = terrain pentu, un petit = presque plat, <em>zéro</em> = on
            est posé sur un sommet, un creux ou un plateau.
          </li>
        </ul>
        <p>
          Une <em>direction</em> et une <em>vitesse</em> tirées d'un seul nombre, sans bouger. C'est
          exactement ce qu'il faut pour décider du <em>prochain petit pas</em>. Et c'est{" "}
          <em>la seule chose</em> qu'on peut mesurer sans aller voir ailleurs sur la courbe — donc
          l'outil idéal quand on est dans le brouillard. C'est pour ça qu'on la retrouve{" "}
          <em>partout</em> dès qu'on cherche à « avancer un peu mieux » : réglage d'un moteur,
          trajectoire d'une fusée, prix optimal en économie, et bien sûr apprentissage des modèles
          d'IA.
        </p>

        <h2>
          Pourquoi on l'appelle <em>« dérivée »</em> ?
        </h2>
        <p>
          Du latin <em>derivare</em> = <em>« détourner un cours d'eau d'une rivière »</em> (dé- +{" "}
          <em>rivus</em>, le ruisseau). En maths, ça veut dire : <em>f'</em> est{" "}
          <strong>tirée</strong> de <em>f</em>, comme un canal est dérivé d'une rivière. Ce n'est
          pas un nombre, c'est une <strong>nouvelle fonction</strong> qu'on{" "}
          <em>obtient à partir de</em> l'ancienne. Le mot et le petit prime <em>'</em> sont de
          Lagrange (1797) ; Newton parlait de <em>fluxions</em>, Leibniz écrivait <em>dy/dx</em>.
          Les trois disent la même chose.
        </p>

        <h2>Précision honnête (pas de mensonge sous le tapis)</h2>
        <p>
          La dérivée n'est <em>pas</em> la pente d'un petit triangle qu'on dessine sur la courbe —
          ça, c'est une approximation, et elle change selon la taille du triangle. La dérivée, c'est
          la valeur <strong>exacte</strong> vers laquelle cette pente <em>tend</em> quand on
          rétrécit le triangle indéfiniment. Elle ne dépend plus de la taille du triangle ; elle est
          l'idéal mathématique d'une mesure <em>« infiniment locale »</em>. C'est ce qui la rend si
          utile : elle dit la vérité <em>exactement à cet endroit</em>, pas une moyenne floue
          autour.
        </p>

        <h2>Ce que démontre cette démo</h2>
        <p>
          Le skieur n'a JAMAIS vu la piste entière. À chaque étape, il a juste senti la pente sous
          ses skis. Pourtant il atteint le bas. C'est ça, la <strong>descente de gradient</strong> :
          à chaque pas on demande à la dérivée <em>« sens et amplitude du meilleur petit pas »</em>,
          et on l'applique. Pas de carte, pas de tâtonnement au hasard.
        </p>
        <p>
          <strong>
            Joue avec <em>η</em>
          </strong>{" "}
          (la taille du pas) :
        </p>
        <ul>
          <li>
            <em>η</em> minuscule (~0,1) : il arrive… mais en cent pas.
          </li>
          <li>
            <em>η</em> bien réglé (~0,5) : convergence rapide et propre.
          </li>
          <li>
            <em>η</em> trop gros ({">"}1,7) : il dépasse le creux à chaque coup, oscille, parfois
            s'envole.
          </li>
        </ul>

        <p class="ds">
          <span class="ds-tag">data science</span>
          <strong>La traduction métaphore → IA réelle.</strong> Tout ce qu'on a appelé jusqu'ici par
          un mot du quotidien a un nom technique en intelligence artificielle :
        </p>
        <ul class="ds-list">
          <li>
            Notre <em>position w</em> sur la piste correspond à un <strong>paramètre</strong> du
            modèle. En jargon ML, on l'appelle <em>weight</em> en anglais (traduit en français par{" "}
            <strong>« poids »</strong>) — c'est un nom <em>technique</em>, ça n'a{" "}
            <em>rien à voir</em> avec le poids corporel du skieur en kilos. C'est juste un nombre
            interne ajustable. La lettre <em>w</em> vient de là (<em>w</em>eight).
          </li>
          <li>
            Notre <em>altitude</em> correspond à l'<strong>erreur</strong> du modèle (à quel point
            il se trompe). On veut le minimum.
          </li>
          <li>
            Notre <em>déplacement</em> à chaque tour correspond à la <strong>mise à jour</strong> du
            paramètre.
          </li>
          <li>
            Notre <em>pente sous les skis</em> correspond à la <strong>dérivée partielle</strong> de
            l'erreur par rapport à ce paramètre, notée <em>∂erreur/∂w</em>.
          </li>
        </ul>
        <p class="ds">
          Dans un vrai modèle, <em>w</em> n'est pas un seul poids mais des milliards. Le paysage
          n'est pas une jolie cuvette : c'est un relief à dimensions vertigineuses, plein de
          vallées, de cols, de plateaux. Mais le principe reste exactement le même : <em>chaque</em>{" "}
          poids reçoit, à chaque pas, sa pente partielle, et on tourne le bouton d'un peu dans le
          sens opposé. Brumeux, local, aveugle — et pourtant, ça marche.
        </p>
      </footer>
    </main>
  );
};

// ── Styles de la page, portés de apps/math/src/style.css ─────────────────
// Scopés sous `.derivee` (la classe du <main id="app">) pour ne pas fuir sur
// le stepper ni sur les autres démos ; le <style> vit DANS le fat-morph et
// est identique à chaque rendu (idempotent pour idiomorph).
const PAGE_CSS = `
  .derivee {
    --d-ink: #1c1a17;
    --d-muted: #7d7568;
    --d-line: #2a2622;
    --d-fog: #ebe5d4;
    --d-fog-deep: #d6cdb6;
    --d-strip: #d9a05b;
    --d-corner: #b94a3a;
    --d-close: #2f7a4d;
    --d-paper: #fbfaf6;
    --d-sans: system-ui, "Segoe UI", Roboto, sans-serif;
    --d-mono: ui-monospace, "SF Mono", Consolas, monospace;
  }
  main#app.derivee {
    max-width: 880px;
    margin: 0 auto;
    padding: 2rem 1.5rem 4rem;
    font: 16px/1.55 var(--d-sans);
    color: var(--d-ink);
  }
  .derivee em {
    font-style: normal;
    font-family: var(--d-mono);
    color: var(--d-ink);
  }
  .derivee strong {
    color: var(--d-ink);
    font-weight: 600;
  }
  .derivee .hint {
    color: var(--d-muted);
    font-size: 0.85em;
  }

  .derivee .page-header {
    text-align: center;
    margin-bottom: 2.5rem;
  }
  .derivee .page-header h1 {
    margin: 0 0 0.6rem;
    font-weight: 500;
    font-size: clamp(1.6rem, 2.8vw, 2.2rem);
    letter-spacing: -0.01em;
  }
  .derivee .page-tagline {
    margin: 0 auto;
    max-width: 42rem;
    color: var(--d-muted);
    line-height: 1.65;
    font-size: 1rem;
    font-family: var(--d-sans); /* neutralise le mono du layout sur header p */
  }
  .derivee .lead {
    margin: 0 auto;
    max-width: 42rem;
    color: var(--d-muted);
    text-align: left;
    line-height: 1.65;
  }

  .derivee .warmup {
    max-width: 42rem;
    margin: 0 auto 3rem;
    color: var(--d-ink);
    line-height: 1.65;
    padding: 1.4rem 1.6rem;
    background: rgba(28, 26, 23, 0.025);
    border: 1px solid rgba(28, 26, 23, 0.06);
    border-radius: 8px;
  }
  .derivee .warmup h2,
  .derivee .demo h2 {
    margin: 0 0 1rem;
    font-size: 1.15rem;
    font-weight: 600;
    color: var(--d-ink);
    letter-spacing: -0.005em;
  }
  .derivee .demo h2 {
    text-align: center;
    margin: 3.5rem 0 1.2rem;
  }
  .derivee .warmup p {
    margin: 0.7rem 0;
    color: var(--d-muted);
  }
  .derivee .warmup p strong {
    color: var(--d-ink);
  }
  .derivee .warmup code {
    font-family: var(--d-mono);
    background: rgba(28, 26, 23, 0.07);
    padding: 0.05em 0.35em;
    border-radius: 3px;
    color: var(--d-ink);
    font-weight: 600;
    font-size: 0.92em;
  }
  .derivee .warmup .centered-formula {
    text-align: center;
    margin: 1.2rem 0;
  }
  .derivee .warmup .centered-formula code {
    font-size: 1.25rem;
    padding: 0.35em 0.8em;
    color: var(--d-close);
    background: rgba(47, 122, 77, 0.08);
  }
  .derivee .warmup-table {
    width: 100%;
    margin: 1rem 0 1.2rem;
    border-collapse: collapse;
    font-family: var(--d-mono);
    font-size: 0.86rem;
    background: var(--d-paper);
    border-radius: 6px;
    overflow: hidden;
  }
  .derivee .warmup-table th {
    text-align: left;
    padding: 0.55rem 0.8rem;
    background: rgba(28, 26, 23, 0.08);
    color: var(--d-ink);
    font-weight: 600;
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    border-bottom: 1px solid rgba(28, 26, 23, 0.1);
  }
  .derivee .warmup-table td {
    padding: 0.4rem 0.8rem;
    color: var(--d-ink);
    border-bottom: 1px solid rgba(28, 26, 23, 0.05);
    font-variant-numeric: tabular-nums;
  }
  .derivee .warmup-table tr:last-child td {
    border-bottom: none;
  }
  .derivee .warmup .transition {
    margin-top: 1.2rem;
    padding-top: 0.9rem;
    border-top: 1px dashed rgba(28, 26, 23, 0.15);
    font-style: italic;
    color: var(--d-muted);
  }
  .derivee .derivation-steps {
    background: var(--d-paper);
    border: 1px solid rgba(28, 26, 23, 0.08);
    border-left: 3px solid var(--d-strip);
    padding: 0.9rem 1.1rem;
    margin: 1.2rem 0;
    border-radius: 4px;
  }
  .derivee .derivation-steps .step {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.5rem 0;
    border-bottom: 1px dashed rgba(28, 26, 23, 0.07);
  }
  .derivee .derivation-steps .step:first-child { padding-top: 0; }
  .derivee .derivation-steps .step:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
  .derivee .derivation-steps .step-label {
    font-size: 0.78rem;
    color: var(--d-muted);
    line-height: 1.5;
  }
  .derivee .derivation-steps .step-eq {
    font-family: var(--d-mono);
    font-size: 0.92rem;
    color: var(--d-ink);
    background: none;
    padding: 0;
    font-weight: 500;
  }
  .derivee .derivation-steps .step-eq strong { color: var(--d-close); }
  .derivee .warmup ul.usefulness {
    margin: 0.6rem 0 1rem;
    padding-left: 1.4rem;
    line-height: 1.65;
    color: var(--d-muted);
  }
  .derivee .warmup ul.usefulness li { margin: 0.55rem 0; }
  .derivee .warmup ul.usefulness li strong { color: var(--d-ink); }

  .derivee .demo > .lead {
    max-width: 42rem;
    margin-left: auto;
    margin-right: auto;
  }

  .derivee .formulas {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.9rem;
    margin: 0 0 1.5rem;
    align-items: stretch;
  }
  @media (max-width: 960px) {
    .derivee .formulas { grid-template-columns: 1fr; }
  }
  .derivee .formula {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.85rem 1rem;
    background: rgba(28, 26, 23, 0.04);
    border: 1px solid rgba(28, 26, 23, 0.08);
    border-radius: 6px;
    margin: 0;
  }
  .derivee .formula-live {
    background: rgba(217, 160, 91, 0.08);
    border-color: rgba(217, 160, 91, 0.3);
  }
  .derivee .formula .f-label {
    font-size: 0.78rem;
    color: var(--d-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    font-weight: 600;
  }
  .derivee .formula > code {
    font-family: var(--d-mono);
    font-size: 0.95rem;
    color: var(--d-ink);
    font-weight: 600;
    padding: 0.3rem 0;
    background: none;
  }
  .derivee .formula sub { font-size: 0.7em; }
  .derivee .formula .f-hint {
    font-size: 0.82rem;
    color: var(--d-muted);
    margin: 0;
    line-height: 1.55;
  }
  .derivee .formula .f-hint code {
    font-family: var(--d-mono);
    font-size: 0.85rem;
    background: rgba(28, 26, 23, 0.06);
    padding: 0.05em 0.3em;
    border-radius: 3px;
    color: var(--d-ink);
  }
  .derivee .formula .derivation {
    margin: 0.2rem 0 0.4rem;
    padding-left: 1.1rem;
    font-size: 0.82rem;
    color: var(--d-muted);
    line-height: 1.6;
  }
  .derivee .formula .derivation li { margin: 0.1rem 0; }
  .derivee .w-note,
  .derivee .eta-note {
    border-left: 2px solid rgba(217, 160, 91, 0.6);
    padding-left: 0.6rem;
    margin: 0.2rem 0 !important;
  }
  .derivee .eta-note p {
    font-size: 0.82rem;
    color: var(--d-muted);
    margin: 0.4rem 0;
    line-height: 1.55;
  }
  .derivee .eta-note p:first-child { margin-top: 0; }
  .derivee .eta-note p:last-child { margin-bottom: 0; }
  .derivee .eta-note code {
    font-family: var(--d-mono);
    font-size: 0.85rem;
    background: rgba(28, 26, 23, 0.06);
    padding: 0.05em 0.3em;
    border-radius: 3px;
    color: var(--d-ink);
  }
  .derivee .def-formula {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
    font-family: var(--d-mono);
    font-size: 0.88rem;
    padding: 0.4rem 0;
    color: var(--d-ink);
  }
  .derivee .def-formula .def-lhs { font-weight: 600; }
  .derivee .def-formula .def-lim {
    font-style: italic;
    color: var(--d-muted);
  }
  .derivee .def-formula .def-lim sub {
    font-size: 0.75em;
    font-style: normal;
  }
  .derivee .def-formula .frac {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    vertical-align: middle;
    font-size: 0.92em;
    line-height: 1.2;
  }
  .derivee .def-formula .num {
    border-bottom: 1.5px solid currentColor;
    padding: 0 0.4em 0.05em;
  }
  .derivee .def-formula .denom { padding: 0.05em 0.4em 0; }
  .derivee .live-calc {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    font-family: var(--d-mono);
    font-size: 0.82rem;
    padding: 0.4rem 0;
  }
  .derivee .live-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    align-items: baseline;
    line-height: 1.5;
  }
  .derivee .live-prefix {
    color: var(--d-muted);
    font-weight: 600;
    min-width: 6.5em;
  }
  .derivee .live-expr { color: var(--d-ink); }
  .derivee .live-eq { color: var(--d-muted); }
  .derivee .live-val {
    color: var(--d-corner);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
  .derivee .live-val.good { color: var(--d-close); }

  .derivee .scene {
    margin: 0 0 2rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .derivee .scene svg {
    width: 100%;
    height: auto;
    display: block;
    background: linear-gradient(180deg, var(--d-fog) 0%, var(--d-fog-deep) 100%);
    border-radius: 6px;
  }
  .derivee .curve-bright {
    fill: none;
    stroke: var(--d-ink);
    stroke-width: 2.6;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .derivee .curve-revealed {
    fill: none;
    stroke: var(--d-line);
    stroke-width: 1.4;
    opacity: 0.22;
    stroke-dasharray: 4 5;
  }
  .derivee .next-step {
    stroke: var(--d-close);
    stroke-width: 3.5;
    stroke-linecap: round;
  }
  .derivee #arrow-head path { fill: var(--d-close); }
  .derivee .skier-figure .skis,
  .derivee .skier-figure .ski-tip {
    stroke: var(--d-ink);
    stroke-width: 4;
    stroke-linecap: round;
  }
  .derivee .skier-figure .skier-leg {
    stroke: var(--d-ink);
    stroke-width: 3;
    stroke-linecap: round;
    fill: none;
  }
  .derivee .skier-figure .skier-body {
    stroke: var(--d-ink);
    stroke-width: 3.5;
    stroke-linecap: round;
    fill: none;
  }
  .derivee .skier-figure .skier-head {
    fill: var(--d-ink);
    stroke: none;
  }
  .derivee .track {
    fill: none;
    stroke: var(--d-strip);
    stroke-width: 3;
    stroke-linecap: round;
    stroke-linejoin: round;
    opacity: 0.7;
  }
  .derivee .ground {
    stroke: rgba(28, 26, 23, 0.18);
    stroke-width: 1;
    stroke-dasharray: 2 4;
  }
  .derivee .axis-label {
    font: 11px var(--d-mono);
    fill: var(--d-muted);
  }

  .derivee .readout {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.5rem;
    font-family: var(--d-mono);
    font-size: 0.85rem;
    margin: 0;
    padding: 0;
  }
  @media (max-width: 720px) {
    .derivee .readout { grid-template-columns: repeat(2, 1fr); }
  }
  .derivee .row {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.2rem;
    padding: 0.5rem 0.7rem;
    border-radius: 6px;
    background: rgba(28, 26, 23, 0.03);
    border: 1px solid rgba(28, 26, 23, 0.06);
  }
  .derivee .row .k { color: var(--d-muted); }
  .derivee .row .v {
    color: var(--d-ink);
    font-variant-numeric: tabular-nums;
  }
  .derivee .row.pente { background: rgba(185, 74, 58, 0.08); }
  .derivee .row.pente .v {
    font-weight: 600;
    color: var(--d-corner);
  }
  .derivee .row.step {
    border-top: 1px dashed #d8d4c6;
    margin-top: 0.25rem;
    padding-top: 0.4rem;
  }
  .derivee .row.step .v {
    font-weight: 600;
    color: var(--d-close);
  }
  .derivee .row.muted { opacity: 0.4; }
  .derivee .status {
    margin-top: 0.6rem;
    padding: 0.55rem 0.8rem;
    font-family: var(--d-mono);
    font-size: 0.88rem;
    border-radius: 6px;
    text-align: center;
    min-height: 1.6em;
    transition: background 0.2s ease, color 0.2s ease;
  }
  .derivee .status.close {
    background: rgba(217, 160, 91, 0.15);
    color: #8a5a1f;
  }
  .derivee .status.arrived {
    background: rgba(47, 122, 77, 0.15);
    color: var(--d-close);
    font-weight: 600;
  }

  .derivee .controls {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.4rem;
    margin: 1.5rem 0 1rem;
  }
  .derivee .slider {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.45rem;
    font-family: var(--d-mono);
    color: var(--d-muted);
    text-align: center;
  }
  .derivee .slider-label { font-size: 0.95rem; }
  .derivee .slider-label output {
    color: var(--d-ink);
    font-variant-numeric: tabular-nums;
  }
  .derivee input[type="range"] {
    width: 18rem;
    accent-color: var(--d-ink);
  }
  .derivee .buttons {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.6rem;
  }
  .derivee .buttons button {
    padding: 0.55rem 1.1rem;
    font: 0.9rem var(--d-mono);
    color: var(--d-paper);
    background: var(--d-ink);
    border: none;
    border-radius: 999px;
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease;
  }
  .derivee .buttons button:hover { background: #3a3530; }
  .derivee .buttons button.ghost {
    background: transparent;
    color: var(--d-muted);
    border: 1px solid #d8d4c6;
  }
  .derivee .buttons button.ghost:hover {
    background: rgba(28, 26, 23, 0.04);
    color: var(--d-ink);
  }
  .derivee .buttons button:focus-visible {
    outline: 2px solid var(--d-strip);
    outline-offset: 3px;
  }

  .derivee footer {
    margin: 3rem auto 0;
    padding-top: 2rem;
    border-top: 1px solid #e8e4d8;
    color: var(--d-muted);
    font-size: 0.95rem;
    max-width: 42rem;
  }
  .derivee footer h2 {
    margin: 2rem 0 0.6rem;
    font-size: 1rem;
    font-weight: 600;
    color: var(--d-ink);
    letter-spacing: -0.005em;
  }
  .derivee footer h2:first-child { margin-top: 0; }
  .derivee footer p {
    margin: 0.8rem 0;
    line-height: 1.65;
  }
  .derivee footer ul {
    margin: 0.4rem 0 0.8rem;
    padding-left: 1.4rem;
    line-height: 1.7;
  }
  .derivee footer ul li { margin: 0.25rem 0; }
  .derivee ul.ds-list {
    margin: 0.4rem 0 1rem;
    padding-left: 1.4rem;
    line-height: 1.65;
  }
  .derivee ul.ds-list li { margin: 0.4rem 0; }
  .derivee .ds {
    margin-top: 1.6rem !important;
    padding-top: 1.2rem;
    border-top: 1px dashed #e0dccc;
  }
  .derivee .ds-tag {
    display: inline-block;
    font-family: var(--d-mono);
    font-size: 0.72em;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    background: var(--d-ink);
    color: var(--d-paper);
    padding: 0.15em 0.55em;
    border-radius: 999px;
    margin-right: 0.4em;
    vertical-align: 0.1em;
  }
`;

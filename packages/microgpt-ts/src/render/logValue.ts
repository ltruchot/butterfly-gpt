import type { Arc, Node } from "../03-autograd.ts";

// ======================================================================
// logValue : un graphe de calcul rendu en SVG (démos, slides)
// ======================================================================
// Racine en haut (la loss), flèches vers le bas : le sens de la passe arrière
// Node ne porte rien pour l'affichage : labels, ops et grads arrivent en Map par nœud
// Sans label : data pour une feuille, composition des enfants pour un nœud interne
// Sans op : symbole déduit des arcs (deux gradients à 1 : "+", gradients croisés : "*")
// Sans table grads : gradient lu sur v.grad, tel que backward l'a posé

const DEPTH_STEP = 90; // moitié de la distance verticale entre deux niveaux
const DATA_W = 80;
const GRAD_W = 80;
const ROW_H = 30; // hauteur d'une sous-case (label, data, [∂] ou grad)
const CIRCLE_R = 16;
const MARGIN = 20;
const CHAR_W = 8;
const LABEL_PAD = 12;
const LABEL_MIN_W = 28;
const COL_PAD = 20; // marge horizontale entre deux nœuds adjacents

export type LogValueOptions = {
  readonly labels?: ReadonlyMap<Node, string>;
  readonly ops?: ReadonlyMap<Node, string>;
  readonly grads?: ReadonlyMap<Node, number>;
  // Dérivée locale ∂ par nœud. Fournie : 4ᵉ sous-case ∂ entre data et grad
  // Absente : 3 sous-cases habituelles, rendu inchangé
  readonly derivatives?: ReadonlyMap<Node, number>;
  // false : masque la sous-case grad. Utile avant que backward n'existe dans le cours
  readonly showGrad?: boolean;
  // Profondeur max rendue (racine = 0). Branches coupées marquées « ⋯ »
  // Absent : graphe entier
  readonly maxDepth?: number;
  // Rang topologique par nœud (ce que renvoie makeTopo). Fournie : pastille numérotée
  // au coin du nœud, l'ordre de construction devient visible. Absent : aucune pastille
  readonly order?: ReadonlyMap<Node, number>;
  // Nœuds retirés proprement (ni boîte, ni arc, pas de « ⋯ »)
  // Exemple : la constante -1 du neg, détail d'implémentation
  readonly hide?: ReadonlySet<Node>;
  // Nœuds rendus mais au sous-arbre coupé (« ⋯ »). Focus sur une branche
  readonly stopAt?: ReadonlySet<Node>;
  // Feuilles-paramètres (embeddings, poids) : style distinct, bord et en-tête teal
  // Ce sont eux que l'optimiseur modifie
  readonly params?: ReadonlySet<Node>;
  // Texte custom pour la sous-case grad (ex. le calcul « ∂ × grad » en cours)
  // Remplace « grad X », affiché plus petit pour tenir dans la boîte
  readonly gradText?: ReadonlyMap<Node, string>;
  // --- États progressifs pour la démo pas-à-pas ---
  // Nœuds visités. Les autres passent en ghost (pointillés, « data ? ») :
  // la passe avant se construit un nœud par clic
  readonly visitedNodes?: ReadonlySet<Node>;
  // Nœuds au grad calculé. Les autres affichent « grad ? », distinct d'un grad 0 plein
  readonly gradPopulatedNodes?: ReadonlySet<Node>;
  // Nœud en exergue (stroke orange épais) : celui créé ou mis à jour à l'étape courante
  readonly highlightNode?: Node;
  // Ids de symbols SVG posés en tête de chaque sous-case (label / data / grad)
  // Les <symbol> doivent exister dans le DOM (sprite inline). Clé absente : pas d'icône
  readonly icons?: {
    readonly leaf?: string;
    readonly data?: string;
    readonly deriv?: string;
    readonly grad?: string;
  };
};

const HIGHLIGHT_STROKE = "#f97316";
const GHOST_STROKE = "#999";
const GHOST_DASH = "4 3";
const GHOST_OPACITY = "0.45";

const detectOp = (v: Node): string => {
  const c = v.children;
  if (c.length === 0) return "";
  if (c.length === 2 && c[0].localGradient === 1 && c[1].localGradient === 1) return "+";
  if (
    c.length === 2 &&
    c[0].localGradient === c[1].target.data &&
    c[1].localGradient === c[0].target.data
  ) {
    return "*";
  }
  return "";
};

const resolveOp = (v: Node, ops: ReadonlyMap<Node, string>): string => ops.get(v) ?? detectOp(v);

const resolveLabel = (
  v: Node,
  labels: ReadonlyMap<Node, string>,
  ops: ReadonlyMap<Node, string>,
): string => {
  const explicit = labels.get(v);
  if (explicit !== undefined) return explicit;
  if (v.children.length === 0) return String(v.data);
  const op = resolveOp(v, ops);
  return v.children.map((a) => resolveLabel(a.target, labels, ops)).join(` ${op} `);
};

export const logValue = (root: Node, options: LogValueOptions = {}): string => {
  const labels = options.labels ?? new Map<Node, string>();
  const ops = options.ops ?? new Map<Node, string>();
  // Gradient d'un nœud : la table fournie (instantanés pas-à-pas) si présente,
  // sinon le champ `v.grad` déposé par `backward`
  const gradOf = (v: Node): number => (options.grads ? (options.grads.get(v) ?? 0) : v.grad);
  // Dérivée locale ∂ : sous-case ajoutée seulement si la table est fournie
  const showDeriv = options.derivatives !== undefined;
  const derivOf = (v: Node): number | undefined => options.derivatives?.get(v);
  // Sous-case grad : visible par défaut. showGrad:false la masque tant que backward
  // n'a pas commencé dans le cours (à makeTopo, on ne fait qu'ordonner)
  const showGrad = options.showGrad ?? true;
  // Hauteur d'un nœud = nombre de sous-cases empilées (label + data [+ ∂] [+ grad])
  const nodeH = ROW_H * (2 + (showDeriv ? 1 : 0) + (showGrad ? 1 : 0));

  // 1. récolte des nœuds atteignables, limitée à `maxDepth` (racine = 0),
  //    au-delà on n'entre plus dans les enfants, le sous-graphe profond est élagué
  const maxDepth = options.maxDepth ?? Infinity;
  const hidden = options.hide ?? new Set<Node>();
  const stopAt = options.stopAt ?? new Set<Node>();
  const values: Node[] = [];
  const seen = new Set<Node>();
  const collect = (v: Node, depth: number): void => {
    if (seen.has(v)) return;
    seen.add(v);
    values.push(v);
    // maxDepth atteint ou point d'arrêt explicite (stopAt) : on n'entre pas
    // dans les enfants, `v` sera rendu avec un « ⋯ »
    if (depth < maxDepth && !stopAt.has(v)) {
      v.children.forEach((a) => {
        if (!hidden.has(a.target)) collect(a.target, depth + 1);
      });
    }
  };
  collect(root, 0);
  // enfants retenus d'un nœud (survivants de l'élagage et non masqués)
  const keptKids = (v: Node): ReadonlyArray<Arc> => v.children.filter((a) => seen.has(a.target));
  // « tronqué » = un enfant coupé par maxDepth (ni rendu ni masqué), on lui
  // dessine un « ⋯ », un enfant masqué (hide) ne compte pas
  const isTruncated = (v: Node): boolean =>
    v.children.some((a) => !seen.has(a.target) && !hidden.has(a.target));

  // 2. Lignes (axe vertical) : racine à 0, chaque enfant à parent+2. Le
  //    pas de 2 réserve une demi-rangée pour la pastille d'opération qui
  //    s'intercale à parent+1 entre le résultat et ses opérandes
  const rows = new Map<Node, number>([[root, 0]]);
  const setRows = (v: Node): void => {
    const r = rows.get(v) as number;
    for (const a of keptKids(v)) {
      if (!rows.has(a.target)) rows.set(a.target, r + 2);
      setRows(a.target);
    }
  };
  setRows(root);

  // 3. Colonnes (axe horizontal) : feuilles via un compteur séquentiel,
  //    nœuds internes = moyenne des colonnes de leurs enfants (équilibrage
  //    visuel au-dessus de leurs opérandes)
  const cols = new Map<Node, number>();
  let leafCounter = 0;
  const setCols = (v: Node): number => {
    const cached = cols.get(v);
    if (cached !== undefined) return cached;
    // un nœud tronqué (tous enfants élagués) est traité comme une feuille
    const kids = keptKids(v);
    let c: number;
    if (kids.length === 0) {
      c = leafCounter++;
    } else {
      const childCols = kids.map((a) => setCols(a.target));
      c = childCols.reduce((acc, x) => acc + x, 0) / childCols.length;
    }
    cols.set(v, c);
    return c;
  };
  setCols(root);

  const allLabels = values.map((v) => resolveLabel(v, labels, ops));
  const labelW = Math.max(LABEL_MIN_W, ...allLabels.map((l) => l.length * CHAR_W + LABEL_PAD));
  // Largeur uniforme d'un nœud : assez large pour la plus grande des 3 lignes
  const nodeW = Math.max(labelW, DATA_W, GRAD_W);
  const colStep = nodeW + COL_PAD;

  const maxCol = Math.max(...values.map((v) => cols.get(v) as number));
  // Les nœuds tronqués portent un « ⋯ » à la rangée d'un enfant (rang +2) :
  // on réserve la hauteur correspondante
  const maxRow = Math.max(
    ...values.map((v) => rows.get(v) as number),
    ...values.filter(isTruncated).map((v) => (rows.get(v) as number) + 2),
  );
  const width = 2 * MARGIN + maxCol * colStep + nodeW;
  const height = 2 * MARGIN + maxRow * DEPTH_STEP + nodeH;

  const boxCenter = (v: Node) => ({
    x: MARGIN + (cols.get(v) as number) * colStep + nodeW / 2,
    y: MARGIN + (rows.get(v) as number) * DEPTH_STEP + nodeH / 2,
  });
  // La pastille d'opération s'intercale entre le résultat et ses enfants,
  // donc une demi-rangée plus bas que le résultat (DEPTH_STEP en y)
  const opCenter = (v: Node) => {
    const b = boxCenter(v);
    return { x: b.x, y: b.y + DEPTH_STEP };
  };

  // Helpers d'état progressif : true par défaut → comportement plein (backward-compat)
  const isVisited = (v: Node): boolean =>
    options.visitedNodes ? options.visitedNodes.has(v) : true;
  const isGradPopulated = (v: Node): boolean =>
    options.gradPopulatedNodes ? options.gradPopulatedNodes.has(v) : true;
  const isHighlight = (v: Node): boolean => v === options.highlightNode;

  const nodes: string[] = [];
  const edges: string[] = [];

  for (const v of values) {
    const center = boxCenter(v);
    const label = resolveLabel(v, labels, ops);
    const grad = gradOf(v);
    nodes.push(
      boxEl(
        center.x,
        center.y,
        label,
        v.data,
        grad,
        nodeW,
        nodeH,
        isVisited(v),
        isGradPopulated(v),
        isHighlight(v),
        options.icons,
        showDeriv,
        derivOf(v),
        showGrad,
        options.params?.has(v) ?? false,
        options.gradText?.get(v),
      ),
    );
    // Pastille d'ordre topologique (coin haut-gauche), si la table est fournie
    const ord = options.order?.get(v);
    if (ord !== undefined) {
      nodes.push(orderBadgeEl(center.x - nodeW / 2, center.y - nodeH / 2, ord));
    }
    if (v.children.length === 0) continue;
    const oc = opCenter(v);
    // La pastille d'op et les flèches descendantes n'existent visuellement
    // qu'à partir du moment où le résultat (parent) a été calculé en forward
    const ghost = !isVisited(v);
    nodes.push(circleEl(oc.x, oc.y, resolveOp(v, ops), ghost));
    edges.push(arrowEl(center.x, center.y + nodeH / 2, oc.x, oc.y - CIRCLE_R, ghost));
    for (const a of keptKids(v)) {
      const cb = boxCenter(a.target);
      edges.push(arrowEl(oc.x, oc.y + CIRCLE_R, cb.x, cb.y - nodeH / 2, ghost));
    }
    // Branche(s) coupée(s) par l'élagage → on MATÉRIALISE la suite : une flèche
    // ghost descend de la pastille d'op vers un « ⋯ » posé au niveau d'un enfant
    if (isTruncated(v)) {
      const ey = MARGIN + ((rows.get(v) as number) + 2) * DEPTH_STEP + nodeH / 2;
      edges.push(arrowEl(oc.x, oc.y + CIRCLE_R, oc.x, ey - 14, true));
      nodes.push(ellipsisEl(oc.x, ey));
    }
  }

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `  <defs>`,
    `    <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">`,
    `      <path d="M0,0 L10,5 L0,10 z" fill="#333"/>`,
    `    </marker>`,
    `  </defs>`,
    ...edges.map((e) => `  ${e}`),
    ...nodes.map((n) => `  ${n}`),
    `</svg>`,
  ].join("\n");
};

const fmt = (n: number): string => (Number.isInteger(n) ? String(n) : n.toFixed(1));
// Valeurs affichées dans les sous-cases : entiers tels quels, décimaux à 2 chiffres
const fmtNum = (n: number): string => (Number.isInteger(n) ? String(n) : n.toFixed(2));
// Teintes du code couleur (mode ∂), reprises de la vue texte de 6j
const DERIV_FILL = "#fdebc8"; // ambre : la dérivée locale notée à l'aller
const GRAD_FILL = "#f7d7d2"; // crimson : le gradient cumulé au retour
const PARAM_STROKE = "#0d9488"; // teal : bord d'une feuille-paramètre (modifiable)
const PARAM_FILL = "#d1f0ea"; // teal clair : en-tête d'un paramètre

const arrowEl = (x1: number, y1: number, x2: number, y2: number, ghost = false): string => {
  if (!ghost) {
    return `<line x1="${fmt(x1)}" y1="${fmt(y1)}" x2="${fmt(x2)}" y2="${fmt(y2)}" stroke="#333" stroke-width="1.2" marker-end="url(#arrow)"/>`;
  }
  return `<line x1="${fmt(x1)}" y1="${fmt(y1)}" x2="${fmt(x2)}" y2="${fmt(y2)}" stroke="${GHOST_STROKE}" stroke-width="1.2" stroke-dasharray="${GHOST_DASH}" opacity="${GHOST_OPACITY}" marker-end="url(#arrow)"/>`;
};

const ICON_SIZE = 14;
const ICON_PAD = 6; // distance entre bord gauche du rect et icône
const ICON_TEXT_GAP = 6; // distance entre icône et début du texte
// Position X du début du texte quand une icône est rendue dans la sous-case
const TEXT_LEFT_OFFSET = ICON_PAD + ICON_SIZE + ICON_TEXT_GAP;

// <use> SVG vers un symbol externe (sprite inline dans le DOM). On retire
// stroke et fill via `currentColor` pour que la couleur soit pilotée par
// CSS sur l'élément parent
const iconEl = (id: string | undefined, x: number, y: number): string => {
  if (!id) return "";
  return `<use href="#${id}" x="${fmt(x)}" y="${fmt(y)}" width="${ICON_SIZE}" height="${ICON_SIZE}" color="#555"/>`;
};

const boxEl = (
  cx: number,
  cy: number,
  label: string,
  data: number,
  grad: number,
  nodeW: number,
  nodeH: number,
  visited = true,
  gradPopulated = true,
  highlight = false,
  icons?: { leaf?: string; data?: string; deriv?: string; grad?: string },
  withDeriv = false,
  deriv?: number,
  withGrad = true,
  isParam = false,
  gradOverride?: string,
): string => {
  const left = cx - nodeW / 2;
  const top = cy - nodeH / 2;
  // Un paramètre (feuille du state_dict) a un bord TEAL ; le surlignage (nœud
  // actif) reste prioritaire
  const stroke = highlight
    ? HIGHLIGHT_STROKE
    : isParam
      ? PARAM_STROKE
      : visited
        ? "#333"
        : GHOST_STROKE;
  const strokeW = highlight ? "3" : isParam ? "2.5" : "1.5";
  const rectExtra = visited ? "" : ` stroke-dasharray="${GHOST_DASH}"`;
  const groupExtra = visited ? "" : ` opacity="${GHOST_OPACITY}"`;
  const iconX = left + ICON_PAD;
  const iconYOffset = (ROW_H - ICON_SIZE) / 2;
  // Quand on rend des icônes, on aligne le texte à GAUCHE juste après
  // l'icône (lisibilité « icône + libellé » fluide). Sans icône, on garde
  // le centrage historique
  const hasIcons = Boolean(icons);
  const textAnchor = hasIcons ? "start" : "middle";
  const textX = hasIcons ? left + TEXT_LEFT_OFFSET : cx;
  // Une sous-case = un rect + (icône) + un texte, empilée à `rowTop`. `fill`
  // par défaut blanc, en mode ∂ on teinte les sous-cases pour retrouver le
  // code couleur de la vue texte (∂ ambre, grad crimson)
  const rowEl = (
    rowTop: number,
    iconId: string | undefined,
    content: string,
    fill = "white",
    fontSize = 13,
  ): string =>
    `<rect x="${fmt(left)}" y="${fmt(rowTop)}" width="${nodeW}" height="${ROW_H}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeW}"${rectExtra}/>` +
    iconEl(iconId, iconX, rowTop + iconYOffset) +
    `<text x="${fmt(textX)}" y="${fmt(rowTop + ROW_H / 2)}" text-anchor="${textAnchor}" dominant-baseline="central" font-family="monospace" font-size="${fontSize}">${content}</text>`;

  const dataText = visited ? `data ${fmtNum(data)}` : "data ?";
  const gradText = gradPopulated ? `grad ${fmtNum(grad)}` : "grad ?";
  // Ligne ∂ : "∂ X" si la dérivée est connue, "∂ —" pour une feuille-entrée
  // qui n'en a pas, "∂ ?" tant que le nœud n'est pas visité
  const derivText = !visited ? "∂ ?" : deriv === undefined ? "∂ —" : `∂ ${fmtNum(deriv)}`;

  // Code couleur en mode ∂ uniquement : ∂ ambre, grad crimson, comme la vue texte
  // de 6j. Sans ∂ la grad reste blanche, snapshots inchangés. La sous-case grad
  // n'existe que si withGrad. En-tête teal clair pour un paramètre, sinon blanc
  const rows = [
    rowEl(top, icons?.leaf, label, isParam ? PARAM_FILL : "white"),
    rowEl(top + ROW_H, icons?.data, dataText),
  ];
  let nextTop = top + 2 * ROW_H;
  if (withDeriv) {
    rows.push(rowEl(nextTop, icons?.deriv, derivText, DERIV_FILL));
    nextTop += ROW_H;
  }
  if (withGrad) {
    // gradOverride (le calcul « ∂ × grad ») remplace « grad X » et passe en
    // police plus petite pour tenir dans la boîte
    const gContent = gradOverride ?? gradText;
    const gFont = gradOverride ? 10 : 13;
    rows.push(rowEl(nextTop, icons?.grad, gContent, withDeriv ? GRAD_FILL : "white", gFont));
  }
  return `<g${groupExtra}>${rows.join("")}</g>`;
};

// Pastille d'ordre topologique : petit disque teal numéroté au coin d'un nœud
// Matérialise le rang du nœud dans la file produite par `makeTopo`
const orderBadgeEl = (cx: number, cy: number, n: number): string =>
  `<g><circle cx="${fmt(cx)}" cy="${fmt(cy)}" r="11" fill="#0f766e" stroke="white" stroke-width="1.5"/><text x="${fmt(cx)}" y="${fmt(cy)}" text-anchor="middle" dominant-baseline="central" font-family="monospace" font-size="11" font-weight="700" fill="white">${n}</text></g>`;

// Marqueur « la branche continue hors-champ » : trois points en ghost, posés
// sous la pastille d'op d'un nœud dont des enfants ont été élagués
const ellipsisEl = (cx: number, cy: number): string =>
  `<text x="${fmt(cx)}" y="${fmt(cy)}" text-anchor="middle" dominant-baseline="central" font-family="monospace" font-size="20" fill="${GHOST_STROKE}">⋯</text>`;

const circleEl = (cx: number, cy: number, op: string, ghost = false): string => {
  if (!ghost) {
    return `<g><circle cx="${fmt(cx)}" cy="${fmt(cy)}" r="${CIRCLE_R}" fill="white" stroke="#333" stroke-width="1.5"/><text x="${fmt(cx)}" y="${fmt(cy)}" text-anchor="middle" dominant-baseline="central" font-family="monospace" font-size="14">${op}</text></g>`;
  }
  return `<g opacity="${GHOST_OPACITY}"><circle cx="${fmt(cx)}" cy="${fmt(cy)}" r="${CIRCLE_R}" fill="white" stroke="${GHOST_STROKE}" stroke-width="1.5" stroke-dasharray="${GHOST_DASH}"/><text x="${fmt(cx)}" y="${fmt(cy)}" text-anchor="middle" dominant-baseline="central" font-family="monospace" font-size="14">${op}</text></g>`;
};

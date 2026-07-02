import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vite-plus/test";
import { add, backward, node, mul } from "../src/03-autograd.ts";
import { logValue } from "../src/render/logValue.ts";

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), "fixtures");
const loadFixture = (name: string) => readFileSync(join(fixturesDir, name), "utf-8");

test("logValue: 1 op (add), racine en haut, feuilles en bas", () => {
  const a = node(2);
  const b = node(-3);
  const labels = new Map([
    [a, "a"],
    [b, "b"],
  ]);
  expect(logValue(add(a, b), { labels })).toBe(loadFixture("one-op-td.svg"));
});

test("logValue: 2 ops (mul + add), racine en haut", () => {
  const a = node(2);
  const b = node(-3);
  const c = node(10);
  const labels = new Map([
    [a, "a"],
    [b, "b"],
    [c, "c"],
  ]);
  expect(logValue(add(mul(a, b), c), { labels })).toBe(loadFixture("two-ops-td.svg"));
});

test("logValue: 3 ops (mul + add + mul), racine en haut", () => {
  const a = node(2);
  const b = node(-3);
  const c = node(10);
  const d = node(5);
  const labels = new Map([
    [a, "a"],
    [b, "b"],
    [c, "c"],
    [d, "d"],
  ]);
  expect(logValue(mul(add(mul(a, b), c), d), { labels })).toBe(loadFixture("three-ops-td.svg"));
});

test("logValue: la racine est au-dessus de ses enfants (orientation top-down)", () => {
  const a = node(2);
  const b = node(3);
  const r = add(a, b);
  const labels = new Map([
    [a, "a"],
    [b, "b"],
  ]);
  const svg = logValue(r, { labels });
  // Racine "a + b" sur la 1re ligne, feuilles "a"/"b" sur la dernière
  const rootY = svg.match(/<rect x="\d+" y="(\d+)"[^>]*\/><text[^>]*>a \+ b</);
  const leafY = svg.match(/<rect x="\d+" y="(\d+)"[^>]*\/><text[^>]*>a</);
  expect(rootY).not.toBeNull();
  expect(leafY).not.toBeNull();
  expect(Number(leafY?.[1])).toBeGreaterThan(Number(rootY?.[1]));
});

test("logValue: les flèches descendent (sens backprop)", () => {
  const a = node(2);
  const b = node(3);
  const svg = logValue(add(a, b));
  // Chaque <line> doit avoir y2 >= y1 (flèche orientée vers le bas)
  const lines = [...svg.matchAll(/<line x1="[\d.]+" y1="([\d.]+)" x2="[\d.]+" y2="([\d.]+)"/g)];
  expect(lines.length).toBeGreaterThan(0);
  for (const m of lines) {
    expect(Number(m[2])).toBeGreaterThanOrEqual(Number(m[1]));
  }
});

test("logValue: label par défaut = data si non fourni", () => {
  const a = node(2);
  const b = node(3);
  const svg = logValue(add(a, b));
  expect(svg).toContain(">2<");
  expect(svg).toContain(">3<");
  expect(svg).toContain(">2 + 3<");
});

test("logValue: détecte automatiquement le symbole + via les arcs", () => {
  const a = node(1);
  const b = node(2);
  const svg = logValue(add(a, b));
  expect(svg).toContain(">+<");
});

test("logValue: détecte automatiquement le symbole * via les arcs", () => {
  const a = node(2);
  const b = node(3);
  const svg = logValue(mul(a, b));
  expect(svg).toContain(">*<");
});

test("logValue: les ops fournis dans la Map prennent le pas sur la détection", () => {
  const a = node(2);
  const b = node(3);
  const r = add(a, b);
  const ops = new Map([[r, "⊕"]]);
  const svg = logValue(r, { ops });
  expect(svg).toContain(">⊕<");
  expect(svg).not.toContain(">+<");
});

test("logValue: grads par défaut affichent 0", () => {
  const a = node(2);
  const b = node(3);
  const svg = logValue(add(a, b));
  expect(svg).toContain("grad 0");
  expect(svg).not.toContain("grad 1");
});

test("logValue: grads issus de backward affichent les vraies dérivées", () => {
  const a = node(2);
  const b = node(3);
  const r = mul(a, b);
  backward(r); // dépose les .grad ; logValue les lit faute de table fournie
  const svg = logValue(r);
  // ∂r/∂a = 3, ∂r/∂b = 2, ∂r/∂r = 1
  expect(svg).toContain("grad 1");
  expect(svg).toContain("grad 2");
  expect(svg).toContain("grad 3");
});

test("logValue: visitedNodes, nœud non-visité affiche `data ?` et style ghost", () => {
  const a = node(2);
  const b = node(3);
  const r = add(a, b);
  // Seul `a` est visité
  const svg = logValue(r, { visitedNodes: new Set([a]) });
  expect(svg).toContain("data 2"); // a visité
  expect(svg).toContain("data ?"); // b et r non visités
  expect(svg).toContain('stroke-dasharray="4 3"'); // style ghost actif
  expect(svg).toContain('opacity="0.45"');
});

test("logValue: visitedNodes complet, rendu identique au comportement par défaut", () => {
  const a = node(2);
  const b = node(3);
  const r = add(a, b);
  const allVisited = new Set([a, b, r]);
  const svgWithVisited = logValue(r, { visitedNodes: allVisited });
  const svgDefault = logValue(r);
  expect(svgWithVisited).toBe(svgDefault);
});

test("logValue: gradPopulatedNodes, affiche `grad ?` pour les non-populés", () => {
  const a = node(2);
  const b = node(3);
  const r = mul(a, b);
  // Seule la racine a son grad calculé
  const svg = logValue(r, {
    grads: new Map([[r, 1]]),
    gradPopulatedNodes: new Set([r]),
  });
  expect(svg).toContain("grad 1"); // racine
  expect(svg).toContain("grad ?"); // a et b
  // sanity : on n'écrit pas "grad 0" (qui serait le défaut pour grad non-déclaré)
  expect(svg).not.toContain("grad 0");
});

test("logValue: highlightNode, stroke épais orange sur la boîte du nœud", () => {
  const a = node(2);
  const b = node(3);
  const r = add(a, b);
  const svg = logValue(r, { highlightNode: r });
  // Le rect doit avoir stroke="#f97316" et stroke-width="3"
  expect(svg).toMatch(/stroke="#f97316"[^>]*stroke-width="3"/);
});

test("logValue: highlightNode absent, pas de stroke orange", () => {
  const a = node(2);
  const b = node(3);
  const svg = logValue(add(a, b));
  expect(svg).not.toContain("#f97316");
});

test("logValue: derivatives, ajoute une sous-case ∂ avec la valeur fournie", () => {
  const a = node(2);
  const b = node(3);
  const r = mul(a, b);
  const svg = logValue(r, {
    derivatives: new Map([
      [a, 3],
      [b, 2],
    ]),
  });
  expect(svg).toContain("∂ 3"); // ∂ notée envers a
  expect(svg).toContain("∂ 2"); // ∂ notée envers b
});

test("logValue: derivatives absent, aucune sous-case ∂ (rendu inchangé)", () => {
  const a = node(2);
  const b = node(3);
  expect(logValue(mul(a, b))).not.toContain("∂");
});

test("logValue: maxDepth, élague le graphe profond et marque un ⋯", () => {
  // m = (a·b) + c  →  add(mul(a,b), c). Racine depth 0, mul/c depth 1, a/b depth 2
  const a = node(2);
  const b = node(3);
  const c = node(4);
  const r = add(mul(a, b), c);
  const full = logValue(r);
  const cut = logValue(r, { maxDepth: 1 }); // on coupe sous mul
  // le graphe complet montre a et b (data 2 / data 3) ; coupé à 1, plus
  expect(full).toContain("data 2");
  expect(cut).not.toContain("data 2");
  // la branche coupée (mul a des enfants élagués) est matérialisée par un edge
  // ghost (pointillés) vers un ⋯ ; le graphe complet n'a ni l'un ni l'autre
  expect(cut).toContain("⋯");
  expect(cut).toContain("stroke-dasharray");
  expect(full).not.toContain("⋯");
  expect(full).not.toContain("stroke-dasharray");
});

test("logValue: showGrad false, masque la sous-case grad (∂ conservée)", () => {
  const a = node(2);
  const b = node(3);
  const r = mul(a, b);
  const derivatives = new Map([[r, 3]]);
  expect(logValue(r, { derivatives })).toContain("grad"); // visible par défaut
  const noGrad = logValue(r, { derivatives, showGrad: false });
  expect(noGrad).not.toContain("grad"); // sous-case grad masquée
  expect(noGrad).toContain("∂"); // ∂ (notée à l'aller) toujours là
});

test("logValue: hide, masque un nœud sans laisser de ⋯", () => {
  const a = node(2);
  const b = node(3);
  const r = add(a, b);
  const svg = logValue(r, { hide: new Set([b]) });
  expect(svg).toContain("data 2"); // a rendu
  expect(svg).not.toContain("data 3"); // b masqué
  expect(svg).not.toContain("⋯"); // b est masqué, pas coupé → aucune troncature
});

test("logValue: stopAt, n'étend pas le sous-arbre (rendu + ⋯)", () => {
  const a = node(2);
  const b = node(3);
  const c = node(4);
  const inner = mul(a, b);
  const r = add(inner, c);
  const svg = logValue(r, { stopAt: new Set([inner]) });
  expect(svg).toContain("⋯"); // inner rendu mais coupé
  expect(svg).not.toContain("data 2"); // a non déplié
  expect(svg).not.toContain("data 3"); // b non déplié
  expect(svg).toContain("data 4"); // c (autre branche) reste visible
});

test("logValue: params, feuille-paramètre a un bord teal distinct", () => {
  const a = node(2);
  const b = node(3);
  const r = mul(a, b);
  expect(logValue(r, { params: new Set([a]) })).toContain("#0d9488");
  expect(logValue(r)).not.toContain("#0d9488"); // sans params, aucun teal
});

test("logValue: gradText, remplace la sous-case grad par un calcul (plus petit)", () => {
  const a = node(2);
  const b = node(3);
  const r = mul(a, b);
  const svg = logValue(r, { gradText: new Map([[r, "3×1"]]) });
  expect(svg).toContain(">3×1</text>"); // calcul affiché à la place de « grad X »
  expect(svg).toContain('font-size="10"'); // en police réduite
  expect(logValue(r)).not.toContain('font-size="10"'); // sinon, police normale
});

test("logValue: data décimale arrondie à 2 chiffres", () => {
  expect(logValue(node(0.33333))).toContain("data 0.33");
  expect(logValue(node(2))).toContain("data 2"); // entier inchangé
});

test("logValue: derivatives, code couleur ∂ ambre / grad crimson", () => {
  const a = node(2);
  const b = node(3);
  const r = mul(a, b);
  const svg = logValue(r, { derivatives: new Map([[r, 3]]) });
  expect(svg).toContain("#fdebc8"); // sous-case ∂ ambre
  expect(svg).toContain("#f7d7d2"); // sous-case grad crimson
  // sans derivatives (3 lignes), aucune teinte
  expect(logValue(r)).not.toContain("#fdebc8");
  expect(logValue(r)).not.toContain("#f7d7d2");
});

test("logValue: maxDepth absent, rendu identique au graphe complet", () => {
  const a = node(2);
  const b = node(3);
  const r = mul(a, b);
  expect(logValue(r, { maxDepth: Infinity })).toBe(logValue(r));
});

test("logValue: order, pastille numérotée par nœud (rang topologique)", () => {
  const a = node(2);
  const b = node(3);
  const r = mul(a, b);
  const order = new Map([
    [a, 1],
    [b, 2],
    [r, 3],
  ]);
  const svg = logValue(r, { order });
  // un disque teal par nœud + le numéro de rang
  expect(svg).toContain('fill="#0f766e"');
  expect(svg).toContain(">1</text>");
  expect(svg).toContain(">3</text>");
});

test("logValue: order absent, aucune pastille (rendu inchangé)", () => {
  const a = node(2);
  const b = node(3);
  expect(logValue(mul(a, b))).not.toContain("#0f766e");
});

test("logValue: derivatives, nœud absent de la table affiche ∂ —", () => {
  const a = node(2);
  const b = node(3);
  const r = add(a, b);
  const svg = logValue(r, { derivatives: new Map([[r, 1]]) });
  expect(svg).toContain("∂ 1"); // r présent dans la table
  expect(svg).toContain("∂ —"); // a, b absents (feuilles-entrées)
});

import { expect, test } from "vite-plus/test";
import {
  add,
  backward,
  backwardSteps,
  div,
  exp,
  log,
  makeTopo,
  mul,
  neg,
  node,
  pow,
  relu,
  sub,
} from "../src/03-autograd.ts";

test("node: crée une feuille sans arcs", () => {
  const a = node(2);
  expect(a.data).toBe(2);
  expect(a.children).toEqual([]);
});

test("node: accepte les nombres négatifs et zéro", () => {
  expect(node(-3).data).toBe(-3);
  expect(node(0).data).toBe(0);
});

test("add: somme les data et pose des gradients locaux à 1", () => {
  const a = node(2);
  const b = node(-3);
  const r = add(a, b);
  expect(r.data).toBe(-1);
  expect(r.children).toEqual([
    { target: a, localGradient: 1 },
    { target: b, localGradient: 1 },
  ]);
});

test("mul: multiplie les data et croise les gradients locaux", () => {
  const a = node(2);
  const b = node(-3);
  const r = mul(a, b);
  expect(r.data).toBe(-6);
  expect(r.children).toEqual([
    { target: a, localGradient: -3 },
    { target: b, localGradient: 2 },
  ]);
});

test("pow: applique la règle de la puissance", () => {
  const a = node(3);
  const r = pow(a, 2);
  expect(r.data).toBe(9);
  expect(r.children).toEqual([{ target: a, localGradient: 2 * 3 }]);
});

test("pow: gère l'exposant négatif (inverse)", () => {
  const a = node(2);
  const r = pow(a, -1);
  expect(r.data).toBe(0.5);
  expect(r.children).toEqual([{ target: a, localGradient: -1 * 2 ** -2 }]);
});

test("log: applique ln et 1/a comme gradient local", () => {
  const a = node(Math.E);
  const r = log(a);
  expect(r.data).toBe(1);
  expect(r.children).toEqual([{ target: a, localGradient: 1 / Math.E }]);
});

test("exp: applique e^a et utilise e^a comme gradient local", () => {
  const a = node(1);
  const r = exp(a);
  expect(r.data).toBe(Math.E);
  expect(r.children).toEqual([{ target: a, localGradient: Math.E }]);
});

test("relu: garde les positifs, gradient local = 1", () => {
  const a = node(3);
  const r = relu(a);
  expect(r.data).toBe(3);
  expect(r.children).toEqual([{ target: a, localGradient: 1 }]);
});

test("relu: coupe les négatifs, gradient local = 0", () => {
  const a = node(-5);
  const r = relu(a);
  expect(r.data).toBe(0);
  expect(r.children).toEqual([{ target: a, localGradient: 0 }]);
});

test("relu: en zéro, gradient local = 0 (sous-gradient)", () => {
  const a = node(0);
  const r = relu(a);
  expect(r.data).toBe(0);
  expect(r.children).toEqual([{ target: a, localGradient: 0 }]);
});

test("neg: opposé via mul(a, node(-1))", () => {
  const a = node(4);
  const r = neg(a);
  expect(r.data).toBe(-4);
  expect(r.children).toHaveLength(2);
  expect(r.children[0]).toEqual({ target: a, localGradient: -1 });
  expect(r.children[1].target.data).toBe(-1);
  expect(r.children[1].localGradient).toBe(4);
});

test("sub: soustraction via add(a, neg(b))", () => {
  const a = node(5);
  const b = node(3);
  const r = sub(a, b);
  expect(r.data).toBe(2);
  expect(r.children).toHaveLength(2);
  expect(r.children[0]).toEqual({ target: a, localGradient: 1 });
  const negB = r.children[1];
  expect(negB.target.data).toBe(-3);
  expect(negB.localGradient).toBe(1);
});

test("div: division via mul(a, pow(b, -1))", () => {
  const a = node(6);
  const b = node(2);
  const r = div(a, b);
  expect(r.data).toBe(3);
  expect(r.children).toHaveLength(2);
  expect(r.children[0].target).toBe(a);
  expect(r.children[0].localGradient).toBe(0.5);
  expect(r.children[1].target.data).toBe(0.5);
  expect(r.children[1].localGradient).toBe(6);
});

test("backward: la racine a un gradient de 1", () => {
  const a = node(2);
  backward(a);
  expect(a.grad).toBe(1);
});

test("backward: add, gradient = 1 pour chaque opérande", () => {
  const a = node(2);
  const b = node(-3);
  const r = add(a, b);
  backward(r);
  expect(r.grad).toBe(1);
  expect(a.grad).toBe(1);
  expect(b.grad).toBe(1);
});

test("backward: mul, gradient d'un opérande = valeur de l'autre", () => {
  const a = node(2);
  const b = node(-3);
  const r = mul(a, b);
  backward(r);
  expect(a.grad).toBe(-3);
  expect(b.grad).toBe(2);
});

test("backward: pow, règle de la puissance", () => {
  const a = node(3);
  const r = pow(a, 2);
  backward(r);
  expect(a.grad).toBe(6);
});

test("backward: log, gradient = 1/a", () => {
  const a = node(4);
  const r = log(a);
  backward(r);
  expect(a.grad).toBe(0.25);
});

test("backward: exp, gradient = e^a", () => {
  const a = node(0);
  const r = exp(a);
  backward(r);
  expect(a.grad).toBe(1);
});

test("backward: relu, gradient = 1 si positif, 0 si négatif", () => {
  const pos = node(2);
  const neg1 = node(-2);
  backward(relu(pos));
  expect(pos.grad).toBe(1);
  backward(relu(neg1));
  expect(neg1.grad).toBe(0);
});

test("backward: composition mul + add, règle de la chaîne", () => {
  const a = node(2);
  const b = node(-3);
  const c = node(10);
  const r = add(mul(a, b), c);
  backward(r);
  expect(a.grad).toBe(-3);
  expect(b.grad).toBe(2);
  expect(c.grad).toBe(1);
});

test("backward: nœud partagé, les contributions s'accumulent", () => {
  // z = x·y + x²  en x=2, y=3  →  ∂z/∂x = y + 2x = 7, ∂z/∂y = x = 2
  const x = node(2);
  const y = node(3);
  const z = add(mul(x, y), pow(x, 2));
  backward(z);
  expect(z.data).toBe(10);
  expect(x.grad).toBe(7);
  expect(y.grad).toBe(2);
});

test("backward: sub, ∂/∂a = 1, ∂/∂b = -1", () => {
  const a = node(5);
  const b = node(3);
  const r = sub(a, b);
  backward(r);
  expect(a.grad).toBe(1);
  expect(b.grad).toBe(-1);
});

test("backward: div, règle du quotient via composition", () => {
  // f(a, b) = a / b  →  ∂f/∂a = 1/b, ∂f/∂b = -a/b²
  const a = node(6);
  const b = node(2);
  const r = div(a, b);
  backward(r);
  expect(a.grad).toBe(0.5);
  expect(b.grad).toBe(-1.5);
});

test("makeTopo: une feuille seule se range en un singleton", () => {
  const a = node(2);
  expect(makeTopo(a)).toEqual([a]);
});

test("makeTopo: ordre postfixe, enfants d'abord, racine en dernier", () => {
  // r = a + b → on visite a puis b (ordre des enfants) avant d'empiler r
  const a = node(2);
  const b = node(3);
  const r = add(a, b);
  expect(makeTopo(r)).toEqual([a, b, r]);
});

test("makeTopo: nœud partagé compté une seule fois (DAG, pas arbre)", () => {
  // z = x·y + x²  : x est l'opérande de deux opérations (mul et pow)
  const x = node(2);
  const y = node(3);
  const m = mul(x, y);
  const p = pow(x, 2);
  const z = add(m, p);
  const topo = makeTopo(z);

  // 5 nœuds distincts, x n'apparaît qu'une fois malgré ses deux parents
  expect(topo.length).toBe(5);
  expect(topo.filter((n) => n === x).length).toBe(1);
  // racine en dernier
  expect(topo.at(-1)).toBe(z);
  // chaque nœud apparaît après ceux dont il dépend (invariant topologique)
  expect(topo.indexOf(x)).toBeLessThan(topo.indexOf(m));
  expect(topo.indexOf(y)).toBeLessThan(topo.indexOf(m));
  expect(topo.indexOf(x)).toBeLessThan(topo.indexOf(p));
  expect(topo.indexOf(m)).toBeLessThan(topo.indexOf(z));
  expect(topo.indexOf(p)).toBeLessThan(topo.indexOf(z));
});

test("backwardSteps: premier yield = phase init avec grad racine = 1", () => {
  const a = node(2);
  const b = node(3);
  const r = add(a, b);
  const iter = backwardSteps(r);
  const first = iter.next().value as { phase: string; grads: ReadonlyMap<unknown, number> };
  expect(first.phase).toBe("init");
  expect(first.grads.get(r)).toBe(1);
  expect(first.grads.size).toBe(1);
});

test("backwardSteps: dernier yield = phase done", () => {
  const a = node(2);
  const r = add(a, node(3));
  const steps = Array.from(backwardSteps(r));
  expect(steps.at(-1)?.phase).toBe("done");
});

test("backwardSteps: dernier step.grads ≡ .grad après backward(r) pour add", () => {
  const a = node(2);
  const b = node(-3);
  const r = add(a, b);
  const last = Array.from(backwardSteps(r)).at(-1)!;
  backward(r); // backwardSteps ne touche pas .grad ; backward le remplit
  expect(last.grads.get(a)).toBe(a.grad);
  expect(last.grads.get(b)).toBe(b.grad);
  expect(last.grads.get(r)).toBe(r.grad);
});

test("backwardSteps: dernier step.grads ≡ backward(r) pour mul+add+pow (nœud partagé)", () => {
  // z = x·y + x²  → ∂z/∂x = 7, ∂z/∂y = 2
  const x = node(2);
  const y = node(3);
  const z = add(mul(x, y), pow(x, 2));
  const last = Array.from(backwardSteps(z)).at(-1)!;
  expect(last.grads.get(x)).toBe(7);
  expect(last.grads.get(y)).toBe(2);
});

test("backwardSteps: nombre de propagations = somme des arcs (init+done en plus)", () => {
  // r = add(a, b) : 2 arcs (r→a, r→b) → 2 propagate + init + done = 4 steps
  const a = node(2);
  const b = node(3);
  const r = add(a, b);
  const steps = Array.from(backwardSteps(r));
  expect(steps.length).toBe(4);
  expect(steps.filter((s) => s.phase === "propagate").length).toBe(2);
});

test("backwardSteps: chaque step propagate désigne le justUpdated et un currentNode", () => {
  const a = node(2);
  const b = node(3);
  const r = mul(a, b);
  const propagateSteps = Array.from(backwardSteps(r)).filter((s) => s.phase === "propagate");
  // mul a 2 arcs : depuis r vers a, puis depuis r vers b
  expect(propagateSteps.length).toBe(2);
  expect(propagateSteps[0].currentNode).toBe(r);
  expect(propagateSteps[0].justUpdated).toBe(a);
  expect(propagateSteps[1].currentNode).toBe(r);
  expect(propagateSteps[1].justUpdated).toBe(b);
});

---
layout: default
---

# Autograd · sous le capot

<div class="rule-ink w-24 my-3" />

<p class="opacity-70 -mt-1">Une seule petite classe, <span class="tag">Node</span> : un nombre qui <strong>se souvient</strong> d'où il vient. Chaque opération est une <strong>brique Lego</strong> qui sait juste comment sa sortie réagit à ses entrées.</p>

<div class="grid grid-cols-3 gap-5 mt-5">

<ComicPanel caption="1 · passe avant">
<p class="text-sm mb-0">On calcule normalement. Au passage, chaque opération <strong>note ses entrées</strong> et sa petite dérivée locale → ça tisse le <strong>graphe</strong> du calcul.</p>
</ComicPanel>

<ComicPanel caption="2 · passe arrière" halftone>
<p class="text-sm mb-0">On part de l'erreur (<span class="tag">grad = 1</span>) et on <strong>remonte le graphe</strong> en enchaînant les rouages. C'est <span class="tag">backward()</span>.</p>
</ComicPanel>

<ComicPanel caption="3 · le verdict">
<p class="text-sm mb-0">Chaque <span class="tag">Node</span> reçoit son <strong>gradient</strong> : de combien l'erreur bougerait si on le poussait. On peut enfin régler le modèle.</p>
</ComicPanel>

</div>

<div class="grid grid-cols-2 gap-6 mt-5">

<div class="panel">
  <div class="band" style="background: var(--ink)">6 briques suffisent</div>
  <p class="text-sm mt-2 mb-0"><code>+</code> · <code>×</code> · <code>^</code> · <code>exp</code> · <code>log</code> · <code>relu</code> — tout le réseau s'assemble à partir d'elles.</p>
</div>

<div class="panel" style="border-color: var(--amber); box-shadow: 6px 6px 0 var(--amber)">
  <div class="band" style="background: var(--amber); color: var(--ink)">les maths derrière → slide suivante</div>
  <p class="text-sm mt-2 mb-0">dérivée · gradient · <strong>règle de la chaîne</strong> · dérivée partielle · accumulation</p>
</div>

</div>

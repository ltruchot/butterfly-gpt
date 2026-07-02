---
layout: default
---

# Les cartouches

<div class="rule-ink w-24 my-3" />

<p class="opacity-70 -mt-1">La brique n°1 du deck réel : <span class="tag">.panel</span> + un modificateur de couleur + un titre <span class="tag">.label-*</span> — souvent révélés au clic (<span class="tag">v-click</span>).</p>

<div class="grid grid-cols-3 gap-5 mt-5">

<div class="panel" v-click>
  <div class="label-ink">.panel</div>
  <div class="text-sm mt-1">Contour encré + ombre dure décalée. Le conteneur par défaut, neutre.</div>
</div>

<div class="panel panel-teal" v-click>
  <div class="label-teal">.panel-teal</div>
  <div class="text-sm mt-1">Pétrole structurant : le contenu « cours », les définitions.</div>
</div>

<div class="panel panel-crimson" v-click>
  <div class="label-crimson">.panel-crimson</div>
  <div class="text-sm mt-1">Accent danger / emphase : pièges, erreurs, points chauds.</div>
</div>

<div class="panel panel-amber" v-click>
  <div class="label-amber">.panel-amber</div>
  <div class="text-sm mt-1">Highlight / énergie : résultats, révélations.</div>
</div>

<div class="panel panel-slate" v-click>
  <div class="label-ink">.panel-slate</div>
  <div class="text-sm mt-1">Fond sombre alternatif, pour les apartés discrets.</div>
</div>

<div class="panel text-center" v-click>
  <bgpt-sfx text="Dataset" color="white" size="1.4rem" />
  <div class="text-sm mt-2 opacity-80">La « brique » : panel centré + SFX en titre — grille des composants du pipeline.</div>
</div>

</div>

---
layout: default
---

# Boutons, tags & bandeaux

<div class="rule-ink w-24 my-3" />

<div class="grid grid-cols-2 gap-6 mt-4">

<div class="panel">
  <div class="text-sm opacity-60">Boutons comics · <span class="tag">.btn</span></div>
  <div class="flex gap-3 mt-3 items-center">
    <button class="btn">Suivant</button>
    <button class="btn btn-crimson">Reset</button>
    <button class="btn btn-amber">Générer</button>
    <button class="btn" disabled>Patience…</button>
  </div>
  <div class="text-sm opacity-70 mt-3">Anton + ombre dure ; l'appui « enfonce » le bouton. Ce sont eux qui pilotent les démos interactives du deck réel.</div>
</div>

<div class="panel">
  <div class="text-sm opacity-60">Étiquette de code · <span class="tag">.tag</span></div>
  <p class="text-sm mt-2 mb-0">L'inline « technique » : une classe <span class="tag">.panel</span>, un fichier <span class="tag">microgpt.py</span>, une valeur <span class="tag">#0f5e5a</span> — fond encre, Fira Code. Partout où le corps de texte cite du code.</p>
</div>

<div class="panel">
  <div class="text-sm opacity-60">En-tête standard · <span class="tag">.rule-ink</span></div>

```md
# Titre de slide
<div class="rule-ink w-24 my-3" />
```

  <div class="text-sm opacity-70 mt-2">Le duo qui ouvre chaque slide : titre Anton + filet encré court.</div>
</div>

<div class="panel">
  <div class="text-sm opacity-60">Bandeau de section · <span class="tag">.band</span></div>
  <div class="mt-3"><span class="band">Titre de section</span></div>
  <div class="text-sm opacity-70 mt-3">Bandeau pétrole encré pour rythmer les parties. La trame <span class="tag">.halftone</span>, elle, est réservée au layout <span class="tag">cover</span>.</div>
</div>

</div>

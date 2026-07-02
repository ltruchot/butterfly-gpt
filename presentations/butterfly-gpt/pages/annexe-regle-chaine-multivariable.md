---
layout: default
---

# {{ $t('chaineMulti.title') }}

<div class="rule-ink w-24 my-3" />

<p class="text-base" style="color: var(--slate)" v-html="$t('chaineMulti.intro')"></p>

<div style="max-width: 640px; margin: 0.2rem auto 0">

<!-- règle de la chaîne multivariable, 100% Datastar : 4 signaux (jours/vitesses)
     → rendu SVG par <bgpt-chaine-ramifiee>, cumul/pente en data-text. Noms de
     signaux EN MINUSCULES (les attributs HTML sont lowercasés). -->
<div v-pre class="ram" data-signals="{nvelo: 2, nvoiture: 2, bike: 4, car: 2}">
  <bgpt-chaine-ramifiee data-attr:nvelo="$nvelo" data-attr:nvoiture="$nvoiture" data-attr:bike="$bike" data-attr:car="$car"></bgpt-chaine-ramifiee>
  <div class="readout">
    <span class="codechip" style="line-height: 1.5"><span data-text="window.bgpt.t('chaineMulti.slopePrefix')"></span><span data-text="window.bgpt.chaineRamifiee.breakdownStr($nvelo, $nvoiture, $bike, $car)"></span> = <strong class="num" data-text="window.bgpt.chaineRamifiee.totalStr($nvelo, $nvoiture, $bike, $car)"></strong></span>
  </div>
  <p class="note"><strong>+1 km/h</strong><span data-text="window.bgpt.t('chaineMulti.noteBase')"></span><strong>+<span data-text="window.bgpt.chaineRamifiee.totalStr($nvelo, $nvoiture, $bike, $car)"></span></strong><span data-text="window.bgpt.t('chaineMulti.noteWeek')"></span><strong>6</strong> · 🚗 ×<span data-text="$bike * $car"></span> = <span data-text="$bike"></span>×<span data-text="$car"></span><span data-text="window.bgpt.t('chaineMulti.noteChain')"></span></p>
  <div class="grid grid-cols-2 gap-x-5">
    <div class="ctrl">
      <span class="text-sm" style="width: 5.5rem" data-text="window.bgpt.t('chaineMulti.bikeDays')"></span>
      <input class="sl-velo" type="range" min="0" max="3" step="1" data-bind:nvelo />
      <span class="tag" style="color: var(--amber)" data-text="$nvelo"></span>
    </div>
    <div class="ctrl">
      <span class="text-sm" style="width: 5.5rem" data-text="window.bgpt.t('chaineMulti.bikeSpeed')"></span>
      <input class="sl-velo" type="range" min="1" max="6" step="1" data-bind:bike />
      <span class="tag" style="color: var(--amber)" data-text="'×' + $bike"></span>
    </div>
    <div class="ctrl">
      <span class="text-sm" style="width: 5.5rem" data-text="window.bgpt.t('chaineMulti.carDays')"></span>
      <input class="sl-voit" type="range" min="0" max="3" step="1" data-bind:nvoiture />
      <span class="tag" style="color: var(--crimson)" data-text="$nvoiture"></span>
    </div>
    <div class="ctrl">
      <span class="text-sm" style="width: 5.5rem" data-text="window.bgpt.t('chaineMulti.carSpeed')"></span>
      <input class="sl-voit" type="range" min="1" max="6" step="1" data-bind:car />
      <span class="tag" style="color: var(--crimson)" data-text="'×' + $car"></span>
    </div>
  </div>
  <p class="foot"><span data-text="window.bgpt.t('chaineMulti.footLead')"></span><strong data-text="window.bgpt.chaineRamifiee.nPiedStr($nvelo, $nvoiture)"></strong><span data-text="window.bgpt.t('chaineMulti.footTail')"></span></p>
</div>

</div>

<!--
- Modèle : une vitesse de base partagée → 6 trajets (chacun = base × facteur du mode).
- z = base·f1 + … + base·f6 → ∂z/∂base = f1+…+f6 = 2·pied + 2·vélo + 2·voiture. C'est l'accumulation.
- × DANS un trajet (le facteur du mode = la chaîne) ; + ENTRE les trajets (le += de backward).
- Le pied ×1,1–1,5 montre qu'un chemin « lent » compte quand même — aucun chemin n'est ignoré.
- Forme identique au code : un nœud réutilisé N fois somme ses N blâmes (z = x·y + x² → ∂z/∂x = y + 2x).
-->

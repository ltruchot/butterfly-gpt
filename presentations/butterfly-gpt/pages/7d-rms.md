---
layout: default
---

<script setup>
import { ref, computed } from "vue";
// THE sound volume. RMS (square → mean → root) = the real volume. Dividing
// each sample by the RMS → values around ±1 (the SHAPE is kept).
const N = 64;
const vol = ref(5); // 0..7, driven by the rotary knob (you grab and turn it)
const samples = computed(() => Array.from({ length: N }, (_, i) => vol.value * Math.sin((i / N) * 2 * Math.PI * 2)));
const moyenne = computed(() => samples.value.reduce((s, x) => s + x, 0) / N);
const rms = computed(() => Math.sqrt(samples.value.reduce((s, x) => s + x * x, 0) / N));
const path = (arr, amp) => arr.map((y, i) => (i ? "L" : "M") + ((i / (N - 1)) * 300).toFixed(1) + " " + (24 - y * amp).toFixed(1)).join(" ");
const wavePath = computed(() => path(samples.value, 2.8));
const rmsY = computed(() => rms.value * 2.8);
const pickIdx = [4, 8, 14, 20, 24, 30];
const brutPicks = computed(() => pickIdx.map((i) => samples.value[i]));
const normPicks = computed(() => pickIdx.map((i) => (rms.value > 0 ? samples.value[i] / rms.value : 0)));

// Rotary knob: value 0..7 ↔ needle from −135° to +135°. You grab and turn.
const knobEl = ref(null);
const knobAngle = computed(() => -135 + (vol.value / 7) * 270);
// 270° progress arc (bottom-left → bottom-right) that fills with the value
const arc = (fromDeg, toDeg, R) => {
  const pt = (d) => { const a = (d * Math.PI) / 180; return [36 + R * Math.sin(a), 36 - R * Math.cos(a)]; };
  const [x1, y1] = pt(fromDeg);
  const [x2, y2] = pt(toDeg);
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${R} ${R} 0 ${toDeg - fromDeg > 180 ? 1 : 0} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
};
const trackPath = arc(-135, 135, 28);
const fillPath = computed(() => arc(-135, knobAngle.value, 28));
const setFromPointer = (e) => {
  const r = knobEl.value.getBoundingClientRect();
  let a = (Math.atan2(e.clientX - (r.left + r.width / 2), -(e.clientY - (r.top + r.height / 2))) * 180) / Math.PI;
  a = Math.max(-135, Math.min(135, a));
  vol.value = Math.round(((a + 135) / 270) * 7);
};
const onMove = (e) => setFromPointer(e);
const onUp = () => {
  window.removeEventListener("pointermove", onMove);
  window.removeEventListener("pointerup", onUp);
};
const onDown = (e) => {
  setFromPointer(e);
  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
};
</script>

# {{ $t('rms.title') }}

<div class="rule-ink w-24 my-3" />

<div class="grid grid-cols-[0.8fr_1.3fr] gap-6 mt-2 items-start">

<div>

<div class="panel panel-teal">
  <div class="mb-0" style="line-height: 0.85; margin-bottom: 0.2rem; display: flex; align-items: center; gap: 0.4rem"><bgpt-sfx text="Root Mean Square" color="white" size="1.2rem" /> <span style="font-size: 1.3rem">🎤</span></div>
  <p class="text-sm" style="margin-bottom: 0; margin-top: 0" v-html="$t('rms.airPressure')"></p>
  <ul class="text-sm" style="margin-top: 0; margin-bottom: 0">
    <li v-html="$t('rms.pushed')"></li>
    <li v-html="$t('rms.pulled')"></li>
  </ul>
  <p class="text-sm" style="margin-top: 0; margin-bottom: 0" v-html="$t('rms.meanZero')"></p>
</div>

</div>

<div>

<div class="panel mb-2 panel-crimson">
  <div class="label-teal" style="font-size: 1rem; display: inline-block; margin-right: 0.6rem">{{ $t('rms.formula') }}</div>
  <span class="centered-formula" style="font-family: 'Fira Code', monospace; font-size: 0.95rem">
    {{ $t('rms.formulaText') }}
  </span>
</div>

<div class="panel panel-teal">

<svg viewBox="0 0 300 48" style="width: 100%; height: auto; background: #fff; border: 1.5px solid var(--ink); border-radius: 4px">
  <line x1="0" y1="24" x2="300" y2="24" stroke="var(--slate)" stroke-width="1" />
  <line x1="0" :y1="24 - rmsY" x2="300" :y2="24 - rmsY" stroke="var(--teal)" stroke-width="1.5" stroke-dasharray="5 3" />
  <path :d="wavePath" fill="none" stroke="var(--crimson)" stroke-width="2" />
  <text x="5" :y="24 - rmsY - 3" fill="var(--teal)" style="font: 700 9px 'Fira Code', monospace">RMS</text>
  <text x="244" y="9" fill="var(--slate)" style="font: 9px 'Fira Code', monospace">{{ $t('rms.pushedAxis') }}</text>
  <text x="255" y="46" fill="var(--slate)" style="font: 9px 'Fira Code', monospace">{{ $t('rms.pulledAxis') }}</text>
  <text x="262" y="21" fill="var(--slate)" style="font: 9px 'Fira Code', monospace">silence</text>
</svg>

<div class="flex items-center justify-center gap-4 my-1" style="user-select: none">
  <span style="font-size: 1.2rem">🔈</span>
  <div ref="knobEl" @pointerdown="onDown" style="position: relative; width: 72px; height: 72px; cursor: grab; touch-action: none">
    <svg viewBox="0 0 72 72" style="position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none">
      <path :d="trackPath" fill="none" stroke="var(--slate)" stroke-width="3" stroke-linecap="round" opacity="0.35" />
      <path :d="fillPath" fill="none" stroke="var(--amber)" stroke-width="5" stroke-linecap="round" />
    </svg>
    <div style="position: absolute; inset: 13px; border-radius: 50%; background: radial-gradient(circle at 34% 28%, var(--slate), var(--ink)); border: 2px solid var(--ink); box-shadow: 0 3px 6px rgba(0,0,0,.35), inset 0 2px 4px rgba(255,255,255,.18)">
      <div :style="{ position: 'absolute', left: '50%', bottom: '50%', width: '3px', height: '44%', transform: 'translateX(-50%) rotate(' + knobAngle + 'deg)', transformOrigin: 'bottom center', background: 'var(--paper)', borderRadius: '2px' }"></div>
    </div>
  </div>
  <span style="font-size: 1.4rem">🔊</span>
</div>

<div class="text-sm mb-1" style="line-height: 1.5">
  <div>{{ $t('rms.meanLabel') }}<strong>0</strong> <span class="opacity-60"></span></div>
  <div>RMS (amplitude) = <strong style="color: var(--crimson)">{{ rms.toFixed(1) }}</strong></div>
</div>

<div class="text-sm mb-1"><span class="codechip"><span class="fn">rmsnorm</span></span>{{ $t('rms.normBefore') }}<strong>{{ rms.toFixed(1) }}</strong>{{ $t('rms.normAfter') }}<strong>±1</strong></div>
<div class="flex gap-1 mb-1" style="font-family: 'Fira Code', monospace; font-size: 10px">
  <span v-for="(x, i) in brutPicks" :key="i" style="flex: 1; text-align: center; border: 1.5px solid var(--ink); border-radius: 3px; padding: 1px 0; background: #fff">{{ x.toFixed(1) }}</span>
</div>
<div class="flex gap-1" style="font-family: 'Fira Code', monospace; font-size: 10px">
  <span v-for="(x, i) in normPicks" :key="i" style="flex: 1; text-align: center; border: 1.5px solid var(--ink); border-radius: 3px; padding: 1px 0; background: #e3f1ec; color: var(--teal); font-weight: 700">{{ x.toFixed(2) }}</span>
</div>


</div>

</div>

</div>

<div style="position: absolute; left: 1rem; bottom: 0; width: 165px; text-align: center">
  <div style="margin-bottom: -0.8rem; position: relative; z-index: 1; transform: translate(34px, -28px) rotate(-5deg)">
    <bgpt-sfx text-key="common.mathBoss" color="crimson" size="0.85rem" />
  </div>
  <img :src="$asset('/klowd-boss-math-2.png')" style="width: 165px; display: block" />
</div>

<div style="position: absolute; left: 178px; bottom: 160px; font-size: 1.6rem; transform: rotate(12deg); opacity: 0.85">🎶</div>
<div style="position: absolute; left: 222px; bottom: 126px; font-size: 1.15rem; transform: rotate(-10deg); opacity: 0.75">🎵</div>

<!--
- Slide BOSS DES MATHS pour RMSNorm. Exemple SANS prérequis : le volume sonore.
- Un son = des échantillons qui vibrent ± autour de 0 (le haut-parleur pousse/tire).
  La MOYENNE est inutile (≈ 0 même pour un son fort). D'où les CARRÉS :
  RMS = √(moyenne des carrés) = le vrai volume.
- Démo : slider volume → l'onde (crimson) change d'amplitude, la ligne RMS suit.
  PUIS ÷ RMS → onde normalisée (teal) de volume 1, FIGÉE (indépendante du slider) :
  c'est le « autour de 1 ». Bouge le volume : le haut change, le bas (÷RMS) ne bouge pas.
- Lien réel + NN : « normaliser le volume » (ReplayGain : tous les morceaux au même
  niveau) = exactement rmsnorm sur un vecteur.
- (Même structure que la tension secteur 230 V RMS, mais sans prérequis électrique.)
-->

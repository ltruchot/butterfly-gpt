---
layout: default
---

# {{ $t('briques.title') }}

<div class="rule-ink w-24 my-3" />

<div class="grid grid-cols-5 gap-3 mt-3">

<div class="panel text-center" style="box-shadow: 6px 6px 0 0 #fff, 6px 6px 0 1.5px var(--ink)" v-click>
<bgpt-sfx text="Dataset" color="white" size="1.4rem" />
<div class="text-sm mt-2 opacity-80">{{ $t('briques.capDataset') }}</div>
</div>

<div class="panel text-center" style="box-shadow: 6px 6px 0 var(--crimson)" v-click>
<bgpt-sfx text="Tokenizer" color="white" size="1.4rem" />
<div class="text-sm mt-2 opacity-80">{{ $t('briques.capTokenizer') }}</div>
</div>

<div class="panel text-center" style="box-shadow: 6px 6px 0 var(--amber)" v-click>
<bgpt-sfx text="Parameters" color="amber" size="1.4rem" />
<div class="text-sm mt-2 opacity-80">{{ $t('briques.capParameters') }}</div>
</div>

<div class="panel text-center" style="box-shadow: 6px 6px 0 var(--teal)" v-click>
<bgpt-sfx text="Autograd" color="amber" size="1.4rem" />
<div class="text-sm mt-2 opacity-80">{{ $t('briques.capAutograd') }}</div>
</div>

<div class="panel text-center" v-click>
<bgpt-sfx text="Optimizer" color="ink" size="1.4rem" />
<div class="text-sm mt-2 opacity-80">{{ $t('briques.capOptimizer') }}</div>
</div>

</div>

<div class="flex justify-center gap-3 mt-3">

<div class="panel text-center" style="width: calc(20% - 0.6rem); box-shadow: 6px 6px 0 var(--slate)" v-click>
<bgpt-sfx text="Training" color="slate" size="1.4rem" />
<div class="text-sm mt-2 opacity-80">{{ $t('briques.capTraining') }}</div>
</div>

<div class="panel text-center" style="width: calc(20% - 0.6rem); box-shadow: 6px 6px 0 var(--slate)" v-click>
<bgpt-sfx text="Inference" color="slate" size="1.4rem" />
<div class="text-sm mt-2 opacity-80">{{ $t('briques.capInference') }}</div>
</div>

</div>

<div class="flex justify-center mt-4">
<div class="panel" style="max-width: 50rem; text-align: center" v-click>
<span style="font-weight:700">{{ $t('briques.archi') }}</span>
<div class="text-sm opacity-60 mt-2">{{ $t('briques.cite') }}</div>
</div>
</div>

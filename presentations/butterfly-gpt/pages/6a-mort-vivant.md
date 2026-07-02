---
layout: default
---
# {{ $t('mortVivant.title') }}
<div class="rule-ink w-20 my-1" />
<div class="text-sm" style="color: var(--slate)" v-html="$t('mortVivant.intro')"></div>
<div class="grid grid-cols-2 items-stretch gap-6 mt-2">
<div class="flex flex-col">
  <div class="panel panel-crimson" style="padding: 0.9rem 1rem; flex: 1; display: flex; flex-direction: column" v-click>
    <div style="display: flex; align-items: baseline; justify-content: center; gap: 0.4rem">
      <bgpt-sfx text-key="mortVivant.sfxDead" color="crimson" size="2rem" />
      <span class="label-ink" style="font-size: 1rem; letter-spacing: 0.03em">{{ $t('mortVivant.inference') }}</span>
    </div>
    <div style="display: flex; gap: 1.2rem; flex: 1; align-items: flex-start; margin-top: 0.3rem">
      <div style="flex: 1; display: flex; justify-content: center">
        <ul class="list-disc pl-4 text-sm leading-tight" style="color: var(--ink)">
          <li v-html="$t('mortVivant.deadReadonly')"></li>
          <li>{{ $t('mortVivant.deadFrozen') }}</li>
          <li v-html="$t('mortVivant.deadFile')"></li>
          <li v-html="$t('mortVivant.deadHarness')"></li>
        </ul>
      </div>
      <div style="display: flex; flex-direction: column; gap: 0.5rem; flex-shrink: 0; align-self: flex-end">
        <div style="display: flex; gap: 0.5rem">
          <img :src="$asset('/comic-agent-1.jpg')" style="height: 5.2rem; border: 2px solid var(--ink)" />
          <img :src="$asset('/comic-agent-2.jpg')" style="height: 5.2rem; border: 2px solid var(--ink)" />
        </div>
        <div style="display: flex; gap: 0.5rem">
          <img :src="$asset('/comic-mort-1.jpg')" style="height: 5.2rem; border: 2px solid var(--ink)" />
          <img :src="$asset('/comic-mort-2.jpg')" style="height: 5.2rem; border: 2px solid var(--ink)" />
        </div>
      </div>
    </div>
  </div>
</div>
<div class="flex flex-col">
  <div class="panel panel-amber" style="padding: 0.9rem 1rem; flex: 1; display: flex; flex-direction: column" v-click>
    <div style="display: flex; align-items: baseline; justify-content: center; gap: 0.4rem">
      <bgpt-sfx text-key="mortVivant.sfxAlive" color="amber" size="2rem" />
      <span class="label-ink" style="letter-spacing: 0.03em">{{ $t('mortVivant.training') }}</span>
    </div>
    <div style="display: flex; gap: 0.4rem; flex: 1; align-items: flex-start; margin-top: 0.3rem">
      <div style="display: flex; flex-direction: column; gap: 0.5rem; flex-shrink: 0; align-self: flex-end">
        <img :src="$asset('/comic-papillon-vivant.jpg')" style="height: 5.2rem; border: 2px solid var(--ink)" />
        <img :src="$asset('/comic-mort-3.jpg')" style="height: 5.2rem; border: 2px solid var(--ink)" />
      </div>
      <div style="flex: 1; display: flex; justify-content: center">
        <ul class="list-disc pl-4 text-sm leading-tight" style="color: var(--ink)">
          <li v-html="$t('mortVivant.aliveWrite')"></li>
          <li>{{ $t('mortVivant.aliveRam') }}</li>
          <li v-html="$t('mortVivant.aliveForward')"></li>
          <li v-html="$t('mortVivant.aliveBackward')"></li>
        </ul>
      </div>
    </div>
  </div>
</div>
</div>
---
layout: default
---

<div style="position: absolute; inset: 0; overflow: hidden; background: var(--ink)">
<img :src="$asset('/daveg-run.jpg')" alt="" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: blur(18px) brightness(0.4) saturate(1.1); transform: scale(1.15)" />
<div style="position: absolute; inset: 0; background: radial-gradient(ellipse at center, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.55) 100%)" />
<div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 1rem; padding: 0.4rem">
<img :src="$asset('/exec-microgpt-crop.jpg')" :alt="$t('execMicrogpt.alt')" style="max-width: 58%; max-height: 100%; object-fit: contain; border: 3px solid var(--ink); box-shadow: 0 14px 40px rgba(0, 0, 0, 0.8)" />
<img :src="$asset('/daveg-run.jpg')" alt="" style="max-width: 40%; max-height: 82%; object-fit: contain; border: 3px solid var(--ink); box-shadow: 0 14px 40px rgba(0, 0, 0, 0.8)" />
</div>
</div>

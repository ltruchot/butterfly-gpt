---
layout: default
---

# Components

Two global components are auto-registered by the theme.

<div class="grid grid-cols-2 gap-12 mt-10">

<div>

### `<LightIcon>`

```md
<light-icon icon="heart" size="32px" />
<light-icon icon="rocket" size="32px" />
<light-icon icon="palette" size="32px" />
```

<div class="mt-4 flex gap-4 text-3xl">
  <light-icon icon="heart" />
  <light-icon icon="rocket" />
  <light-icon icon="palette" />
</div>

Icon names: [lightvue.org/getting-started/light-icons](https://lightvue.org/getting-started/light-icons)

</div>

<div>

### `<IconBox>`

```md
<icon-box>
  <light-icon icon="brand-twitter" size="24px" />
</icon-box>
```

<div class="mt-4 flex gap-4">
  <icon-box><light-icon icon="brand-twitter" size="24px" /></icon-box>
  <icon-box><light-icon icon="brand-github" size="24px" /></icon-box>
  <icon-box><light-icon icon="brand-npm" size="24px" /></icon-box>
</div>

</div>

</div>

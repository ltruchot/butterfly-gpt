<template>
  <!-- Pastille de palette : aplat couleur encadré + hex + rôle. Le carré reçoit
       la couleur via la prop `hex`. Usage :
       <Swatch hex="#b5223a" name="crimson" role="accent / danger" /> -->
  <div class="swatch">
    <div class="swatch-chip ink-border" :style="{ background: hex }" />
    <div class="swatch-meta">
      <div class="swatch-name">{{ name }}</div>
      <code class="swatch-hex">{{ hex }}</code>
      <div class="swatch-role">{{ role }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  hex: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, default: "" },
});
</script>

<style scoped>
.swatch {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.swatch-chip {
  height: 4.5rem;
  width: 100%;
}
.swatch-name {
  font-family: "Anton", sans-serif;
  text-transform: uppercase;
  font-size: 1.05rem;
  letter-spacing: 0.02em;
}
.swatch-hex {
  font-family: "Fira Code", monospace;
  font-size: 0.8rem;
  color: var(--crimson);
}
.swatch-role {
  font-size: 0.78rem;
  opacity: 0.7;
  line-height: 1.2;
}
</style>

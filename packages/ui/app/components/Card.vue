<script setup lang="ts">
defineProps<{ title?: string }>()
</script>

<template>
  <section class="ui-card">
    <h3 v-if="title" class="ui-card__title">{{ title }}</h3>
    <slot />
  </section>
</template>

<style scoped>
.ui-card { border: 1px solid var(--c-border); border-radius: var(--radius); padding: 16px; background: var(--c-surface); }
.ui-card__title { margin: 0 0 8px; font-size: 1.05rem; }
</style>

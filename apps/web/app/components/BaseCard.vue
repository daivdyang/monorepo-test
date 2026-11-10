<script setup lang="ts">
defineProps<{ title?: string }>()
</script>

<template>
  <section class="card">
    <h3 v-if="title" class="card__title">{{ title }}</h3>
    <slot />
  </section>
</template>

<style scoped>
.card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; background: #fff; }
.card__title { margin: 0 0 8px; font-size: 1.05rem; }
</style>

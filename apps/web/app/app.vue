<script setup lang="ts">
const { public: { siteName } } = useRuntimeConfig()
</script>

<template>
  <div>
    <header class="header">
      <NuxtLink to="/" class="brand">{{ siteName }}</NuxtLink>
      <span class="tag">前台</span>
    </header>
    <main class="main">
      <NuxtPage />
    </main>
  </div>
</template>

<style scoped>
.header { display: flex; gap: 12px; align-items: center; padding: 12px 24px; border-bottom: 1px solid var(--c-border); }
.brand { font-weight: 700; font-size: 1.2rem; text-decoration: none; color: inherit; }
.tag { font-size: .75rem; padding: 2px 8px; border-radius: 99px; background: var(--c-primary-soft); color: var(--c-primary); }
.main { max-width: 960px; margin: 0 auto; padding: 24px; }
</style>

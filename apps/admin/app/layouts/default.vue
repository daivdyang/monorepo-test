<script setup lang="ts">
const { user, logout } = useAuth()
</script>

<template>
  <div class="admin">
    <aside class="sidebar">
      <div class="brand">Mono Admin <span class="tag">後台</span></div>
      <nav>
        <NuxtLink to="/">儀表板</NuxtLink>
        <NuxtLink to="/products">商品管理</NuxtLink>
      </nav>
      <div class="user">
        <small>{{ user?.name }}（{{ user?.role }}）</small>
        <BaseButton variant="ghost" @click="logout">登出</BaseButton>
      </div>
    </aside>
    <main class="content">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.admin { display: grid; grid-template-columns: 220px 1fr; min-height: 100vh; }
.sidebar { background: #111827; color: #e5e7eb; padding: 16px; display: flex; flex-direction: column; gap: 16px; }
.brand { font-weight: 700; }
.tag { font-size: .7rem; padding: 2px 6px; border-radius: 99px; background: #374151; }
nav { display: flex; flex-direction: column; gap: 8px; flex: 1; }
nav a { color: #d1d5db; text-decoration: none; padding: 6px 8px; border-radius: 6px; }
nav a.router-link-exact-active { background: #374151; color: #fff; }
.user { display: flex; flex-direction: column; gap: 8px; }
.content { padding: 24px; }
</style>

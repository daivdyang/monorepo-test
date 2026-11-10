<script setup lang="ts">
import { isSoldOut, type ApiResponse, type Product } from '@mono/core'

// SSR 時直接呼叫 server handler（不走網路），結果隨 HTML payload 送到瀏覽器
const { data } = await useFetch<ApiResponse<Product[]>>('/api/products')
</script>

<template>
  <div>
    <h1>商品列表</h1>
    <div class="grid">
      <UiCard v-for="p in data?.data" :key="p.id" :title="p.name">
        <p><UiPrice :value="p.price" /></p>
        <p :style="{ color: isSoldOut(p) ? 'var(--c-danger)' : 'var(--c-muted)' }">
          {{ isSoldOut(p) ? '已售完' : `庫存 ${p.stock}` }}
        </p>
        <NuxtLink :to="`/products/${p.id}`">
          <UiButton variant="ghost">查看</UiButton>
        </NuxtLink>
      </UiCard>
    </div>
  </div>
</template>

<style scoped>
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }
</style>

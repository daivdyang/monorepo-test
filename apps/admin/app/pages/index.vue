<script setup lang="ts">
import { isOnStorefront, isSoldOut, type ApiResponse, type Product } from '@mono/core'

const { data } = await useFetch<ApiResponse<Product[]>>('/api/products')

const stats = computed(() => {
  const list = data.value?.data ?? []
  return {
    total: list.length,
    published: list.filter(isOnStorefront).length,
    soldOut: list.filter(isSoldOut).length,
  }
})
</script>

<template>
  <div>
    <h1>儀表板</h1>
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
      <BaseCard title="商品總數">{{ stats.total }}</BaseCard>
      <BaseCard title="已上架">{{ stats.published }}</BaseCard>
      <BaseCard title="已售完">{{ stats.soldOut }}</BaseCard>
    </div>
  </div>
</template>

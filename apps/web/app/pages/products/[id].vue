<script setup lang="ts">
import type { Product } from '#shared/types/product'
import { formatPrice } from '#shared/utils/format'

const route = useRoute()
const { data: product, error } = await useFetch<Product>(`/api/products/${route.params.id}`)

if (error.value) {
  throw createError({ statusCode: 404, statusMessage: '找不到商品', fatal: true })
}

useSeoMeta({ title: () => product.value?.name ?? '商品' })
</script>

<template>
  <div v-if="product">
    <NuxtLink to="/">← 回列表</NuxtLink>
    <h1>{{ product.name }}</h1>
    <p>售價：{{ formatPrice(product.price) }}</p>
    <BaseButton :disabled="!product.stock">{{ product.stock ? '加入購物車' : '已售完' }}</BaseButton>
  </div>
</template>

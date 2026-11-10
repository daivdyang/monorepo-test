<script setup lang="ts">
import { isSoldOut, type Product } from '@mono/core'

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
    <p>售價：<UiPrice :value="product.price" /></p>
    <UiButton :disabled="isSoldOut(product)">{{ isSoldOut(product) ? '已售完' : '加入購物車' }}</UiButton>
  </div>
</template>

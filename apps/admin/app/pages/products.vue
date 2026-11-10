<script setup lang="ts">
import { formatPrice, type ApiResponse, type Product } from '@mono/core'

const { data, refresh } = await useFetch<ApiResponse<Product[]>>('/api/products')

async function togglePublished(p: Product) {
  await $fetch(`/api/products/${p.id}`, {
    method: 'PATCH',
    body: { published: !p.published },
  })
  await refresh()
}
</script>

<template>
  <div>
    <h1>商品管理</h1>
    <table>
      <thead>
        <tr><th>ID</th><th>名稱</th><th>價格</th><th>庫存</th><th>狀態</th><th /></tr>
      </thead>
      <tbody>
        <tr v-for="p in data?.data" :key="p.id">
          <td>{{ p.id }}</td>
          <td>{{ p.name }}</td>
          <td>{{ formatPrice(p.price) }}</td>
          <td>{{ p.stock }}</td>
          <td>{{ p.published ? '已上架' : '未上架' }}</td>
          <td>
            <BaseButton :variant="p.published ? 'danger' : 'primary'" @click="togglePublished(p)">
              {{ p.published ? '下架' : '上架' }}
            </BaseButton>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

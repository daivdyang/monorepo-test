<script setup lang="ts">
// UI 元件依賴 @mono/core（ui -> core），反過來則不允許
import { formatPrice } from '@mono/core'

defineProps<{ value: number }>()
</script>

<template>
  <span class="ui-price">{{ formatPrice(value) }}</span>
</template>

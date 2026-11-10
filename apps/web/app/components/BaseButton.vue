<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'primary' | 'danger' | 'ghost'
  type?: 'button' | 'submit'
}>(), { variant: 'primary', type: 'button' })
</script>

<template>
  <button :type="type" class="btn" :class="`btn--${variant}`">
    <slot />
  </button>
</template>

<style scoped>
.btn { border: 1px solid transparent; border-radius: 8px; padding: 6px 14px; cursor: pointer; font: inherit; }
.btn--primary { background: #00a86b; color: #fff; }
.btn--danger { background: #e5484d; color: #fff; }
.btn--ghost { background: transparent; border-color: #e5e7eb; color: inherit; }
</style>

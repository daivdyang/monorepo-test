<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'primary' | 'danger' | 'ghost'
  type?: 'button' | 'submit'
}>(), { variant: 'primary', type: 'button' })
</script>

<template>
  <button :type="type" class="ui-btn" :class="`ui-btn--${variant}`">
    <slot />
  </button>
</template>

<style scoped>
.ui-btn { border: 1px solid transparent; border-radius: var(--radius); padding: 6px 14px; cursor: pointer; font: inherit; }
.ui-btn:disabled { opacity: .5; cursor: not-allowed; }
.ui-btn--primary { background: var(--c-primary); color: #fff; }
.ui-btn--danger { background: var(--c-danger); color: #fff; }
.ui-btn--ghost { background: transparent; border-color: var(--c-border); color: inherit; }
</style>

<script setup lang="ts">
definePageMeta({ layout: 'blank' })

const { login } = useAuth()
const route = useRoute()
const password = ref('')
const errorMsg = ref('')

async function onSubmit() {
  errorMsg.value = ''
  try {
    await login(password.value)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    await navigateTo(redirect)
  }
  catch {
    errorMsg.value = '密碼錯誤'
  }
}
</script>

<template>
  <UiCard title="後台登入" style="width: 320px;">
    <form style="display: flex; flex-direction: column; gap: 12px;" @submit.prevent="onSubmit">
      <input v-model="password" type="password" placeholder="密碼（預設 admin123）" style="padding: 8px;">
      <p v-if="errorMsg" style="color: var(--c-danger); margin: 0;">{{ errorMsg }}</p>
      <UiButton type="submit">登入</UiButton>
    </form>
  </UiCard>
</template>

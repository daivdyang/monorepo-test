import { defineMonoConfig } from '@mono/eslint-config'

export default defineMonoConfig().append({
  // 元件以 prefix 'Ui' 註冊（nuxt.config.ts），實際使用名稱是 <UiButton>，已是多字名稱
  files: ['app/components/**/*.vue'],
  rules: { 'vue/multi-word-component-names': 'off' },
})

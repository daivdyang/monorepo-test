export default defineNuxtConfig({
  compatibilityDate: '2026-11-01',
  extends: ['@mono/ui'],
  devtools: { enabled: true },
  css: ['~/assets/theme.css'], // 在 layer 的 tokens.css 之後載入，覆寫主色
  app: {
    head: {
      title: 'Mono Admin',
      htmlAttrs: { lang: 'zh-Hant-TW' },
      meta: [{ name: 'robots', content: 'noindex, nofollow' }], // 後台不給搜尋引擎收錄
    },
  },
  runtimeConfig: {
    adminPassword: 'admin123', // 僅 server 可讀；正式環境用 NUXT_ADMIN_PASSWORD 覆寫
  },
})

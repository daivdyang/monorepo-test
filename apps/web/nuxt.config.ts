export default defineNuxtConfig({
  compatibilityDate: '2026-11-01',
  extends: ['@mono/ui'],
  devtools: { enabled: true },
  app: {
    head: {
      title: 'Mono Shop',
      htmlAttrs: { lang: 'zh-Hant-TW' },
    },
  },
  runtimeConfig: {
    public: {
      siteName: 'Mono Shop', // NUXT_PUBLIC_SITE_NAME 可覆寫
    },
  },
})

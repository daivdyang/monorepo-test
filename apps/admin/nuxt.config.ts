import { fileURLToPath } from 'node:url'

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
  nitro: {
    // node:sqlite 是 Node 內建模組，明確標為 external（Nitro 的內建清單尚未收錄它）
    rollupConfig: { external: ['node:sqlite'] },
  },
  runtimeConfig: {
    // 與前台共用同一個 SQLite 檔；部署時以 NUXT_DB_PATH 指定
    dbPath: fileURLToPath(new URL('../../.data/mono.db', import.meta.url)),
    adminPassword: 'admin123', // 僅 server 可讀；正式環境用 NUXT_ADMIN_PASSWORD 覆寫
  },
})

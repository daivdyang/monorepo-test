import { fileURLToPath } from 'node:url'

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
  nitro: {
    // node:sqlite 是 Node 內建模組，明確標為 external（Nitro 的內建清單尚未收錄它）
    rollupConfig: { external: ['node:sqlite'] },
  },
  runtimeConfig: {
    // 前後台指向同一個 SQLite 檔（repo 根目錄 .data/mono.db）。
    // 預設值在 build 時被寫成絕對路徑；部署時務必以 NUXT_DB_PATH 指定。
    dbPath: fileURLToPath(new URL('../../.data/mono.db', import.meta.url)),
    public: {
      siteName: 'Mono Shop', // NUXT_PUBLIC_SITE_NAME 可覆寫
    },
  },
})

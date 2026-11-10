import { fileURLToPath } from 'node:url'

// @mono/ui 是一個 Nuxt Layer：apps 透過 `extends: ['@mono/ui']` 繼承。
// layer 內的 app/components、app/composables、app/utils、nuxt.config 會合併進使用它的 app。
//
// ⚠️ layer 內一律使用絕對路徑：相對路徑會以「使用端 app」為基準解析而出錯。
const here = (p: string) => fileURLToPath(new URL(p, import.meta.url))

export default defineNuxtConfig({
  compatibilityDate: '2026-11-01',
  css: [here('./app/assets/tokens.css')],
  components: [
    // 加前綴避免與 app 自己的元件撞名：<UiButton>、<UiCard>、<UiPrice>
    { path: here('./app/components'), prefix: 'Ui' },
  ],
})

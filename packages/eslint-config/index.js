// @ts-check
import { createConfigForNuxt } from '@nuxt/eslint-config/flat'

/**
 * 檔案層級的邊界規則。
 * turbo boundaries 只能檢查「套件 A 能不能依賴套件 B」；
 * 但 apps/web 本來就合法依賴 @mono/db（給 server/ 用），
 * 「瀏覽器端程式碼（app/）不可 import server-only 套件」必須在檔案層級檢查。
 */
const clientBoundary = {
  name: 'mono/client-boundary',
  files: ['app/**/*.{ts,vue}'],
  rules: {
    'no-restricted-imports': ['error', {
      paths: [
        { name: '@mono/db', message: '@mono/db 是 server-only，請在 server/ 內使用，前端透過 API 取得資料。' },
      ],
      patterns: [
        { group: ['node:*'], message: 'app/ 會在瀏覽器執行，不可使用 Node 內建模組。' },
      ],
    }],
  },
}

/** 所有 Nuxt 套件（apps/*、packages/ui）共用的 ESLint 設定 */
export function defineMonoConfig() {
  return createConfigForNuxt({
    features: { typescript: true },
  }).append(clientBoundary)
}

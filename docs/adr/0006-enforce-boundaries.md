# 0006 以工具強制依賴邊界（套件層級 + 檔案層級）

- 狀態：已接受
- 引入於：step-07

## 背景
step-03 ~ step-06 建立了依賴方向（apps → ui → core、db 為 server-only），但只寫在文件裡。
沒有強制的設計規則，會在幾個月後被一個「先這樣寫，之後再改」的 PR 打破。

## 決定：兩層檢查
| 層級 | 工具 | 檢查什麼 |
|---|---|---|
| 套件 | `turbo boundaries` + tags | 套件 A 可不可以依賴套件 B；import 了卻沒在 package.json 宣告；用相對路徑跨出套件 |
| 檔案 | ESLint `no-restricted-imports`（`@mono/eslint-config`） | `app/`（瀏覽器端）不可 import `@mono/db`、`node:*` |

為什麼需要兩層？`apps/web` **合法地**依賴 `@mono/db`（給 `server/` 用），
套件層級無法區分「同一個套件裡的 server 端與 client 端」，必須在檔案層級補上。

### Tag 規則（turbo.json）
| Tag | 套件 | 規則 |
|---|---|---|
| `app` | web、admin | `dependents.allow: []` —— 沒有任何套件可以依賴 app |
| `ui` | ui | 只能依賴 `core`、`config` |
| `core` | core | 只能依賴 `config` —— 保持純粹 |
| `server-only` | db | 只能依賴 `core`、`config` |
| `config` | tsconfig、eslint-config | — |

## 實測結果
- 導入當下即抓到一個既存問題：`apps/admin` import `h3` 卻未宣告（phantom dependency，靠 nuxt 間接安裝）。
  修正時發現 npm 上 h3 latest 是 2.x，但 nuxt 4.6 內部用 1.x —— 必須釘在相同 major，否則型別不一致。
- ui 依賴 db → `Package @mono/db found without any tag listed in allowlist for @mono/ui`
- `app/pages/index.vue` import `@mono/db` → ESLint error；`server/utils/db.ts` 不受影響

## 後果
- ✅ 設計規則可被 CI 驗證（`pnpm check`）
- ✅ 共用 ESLint 設定集中在 `@mono/eslint-config`（「設定也是套件」）
- ⚠️ 新增套件時必須加上 tag，否則不受規則約束
- ⚠️ 有時規則需要例外（例：ui 元件以前綴註冊，需關閉 multi-word-component-names），例外要寫明理由

# 0003 以 Nuxt Layer 共用 UI，並用設計 token 支援各 app 主題

- 狀態：已接受
- 引入於：step-04

## 背景
`BaseButton`、`BaseCard` 在前後台各一份，前台綠、後台藍，其他細節也開始各自演化。
但後台確實「想要」不同主色 —— 問題不是要不要一樣，而是**差異應該發生在哪一層**。

## 選項
| 選項 | 優點 | 缺點 |
|---|---|---|
| Vue 元件庫（vite library mode 建置） | 可給非 Nuxt 專案使用 | 需要 build；要手動 import；無法共用 composables / middleware / server |
| Nuxt Module | 功能最強、可程式化修改 Nuxt | 撰寫成本高，適合可發佈的通用功能 |
| **Nuxt Layer** | 就是一個 Nuxt 專案結構；元件 / composables / utils / server / nuxt.config 自動合併；不需 build | 只能給 Nuxt 使用；同名檔案的覆蓋規則需要理解 |

## 決定
- 採用 **Nuxt Layer**（`packages/ui`），apps 以 `extends: ['@mono/ui']` 繼承。
- 元件以 `Ui` 前綴註冊，避免與 app 元件撞名。
- 元件只引用 CSS 變數（`--c-primary` 等），**主題差異由 app 覆寫 token**，而非複製元件。
- layer 職責限定為「呈現」：不放資料存取、不放驗證邏輯。

## 依賴方向
```
apps/*  ──extends──▶  @mono/ui  ──import──▶  @mono/core
```
ui 可以依賴 core（`<UiPrice>` 使用 `formatPrice`），core 不可依賴 ui。

## 後果
- ✅ 元件只有一份；後台換色只需 4 行 CSS（`apps/admin/app/assets/theme.css`）
- ✅ 修改 layer，前後台同時 HMR
- ⚠️ layer 內必須用絕對路徑（`fileURLToPath(new URL(...))`）
- ⚠️ app 中同名元件會覆蓋 layer 元件 —— 這是功能也是陷阱
- ⚠️ layer 與 app 必須使用同一版 Nuxt（由 ADR 0001 的 catalog 保證）

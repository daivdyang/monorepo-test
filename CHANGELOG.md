# Changelog

本教學每個步驟對應一個 git tag（`step-XX`），最新的在最上面。
每一節都包含：**動機**（遇到什麼問題）→ **變更** → **學到的設計觀念** → **如何驗證**。

<!-- next -->

## [step-01] 兩個各自獨立的 Nuxt app（刻意重複）

### 動機
在導入任何 monorepo 工具之前，先看看「把兩個專案放在同一個資料夾」會發生什麼事。
這是許多團隊的起點：前台、後台由不同人開發，程式碼靠複製貼上同步。

### 變更
- 新增 `apps/web`：前台（port 3000），SSR、只顯示已上架商品
- 新增 `apps/admin`：後台（port 3001），登入驗證、可上下架商品
- 兩個 app 各自擁有：`package.json`、`pnpm-lock.yaml`、`pnpm-workspace.yaml`（allowBuilds）、
  `Product` 型別、`formatPrice()`、`BaseButton` / `BaseCard`、假資料

### 刻意留下的痛點（後續步驟逐一解決）
| # | 痛點 | 現況 | 解決於 |
|---|---|---|---|
| 1 | 依賴各裝各的 | 兩份 lockfile、兩份 node_modules、Nuxt 版本可能漂移 | step-02 |
| 2 | 型別重複 | `Product` 寫了兩次，改一邊另一邊不會報錯 | step-03 |
| 3 | 邏輯已分歧 | `formatPrice` 前台輸出 `$3,290`、後台輸出 `NT$ 3,290` | step-03 |
| 4 | UI 已分歧 | `BaseButton` 主色前台綠、後台藍 | step-04 |
| 5 | 沒有統一指令 | 要分別 `cd` 進去執行 install / dev / build | step-02、step-05 |
| 6 | 資料不共享 | 後台下架商品，前台完全不知道（兩個行程各自一份記憶體） | step-06 |

### 學到的設計觀念
- **Nuxt 4 的 `shared/` 目錄 ≠ monorepo 的共用套件**：`shared/` 只能在「同一個 app 的 app/ 與 server/ 之間」共用；
  跨 app 共用需要的是獨立的套件（package）。
- 「放在同一個 repo」本身不等於 monorepo，monorepo 的價值來自**共用機制與工具鏈**。

### 如何驗證
```bash
cd apps/web && pnpm install && pnpm build
cd apps/admin && pnpm install && pnpm build
```
兩邊都能獨立建置成功；比對 `apps/*/shared/utils/format.ts` 可看到已分歧的實作。

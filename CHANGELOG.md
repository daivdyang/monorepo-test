# Changelog

本教學每個步驟對應一個 git tag（`step-XX`），最新的在最上面。
每一節都包含：**動機**（遇到什麼問題）→ **變更** → **學到的設計觀念** → **如何驗證**。

<!-- next -->

## [step-04] 抽出 `@mono/ui`（Nuxt Layer + 設計 token）

### 動機
解決痛點 #4：`BaseButton` / `BaseCard` 兩份實作，前台綠、後台藍，細節持續分歧。
但後台確實需要不同主色 —— 關鍵在於**差異應該發生在哪一層**。

### 變更
- 新增 `packages/ui`（`@mono/ui`），是一個 Nuxt Layer：
  - `app/components/`：`Button`、`Card`、`Price`（以 `Ui` 前綴註冊 → `<UiButton>`…）
  - `app/assets/tokens.css`：設計 token（`--c-primary` 等）與全域基礎樣式
  - `<UiPrice>` 內部使用 `@mono/core` 的 `formatPrice`（ui → core）
- 前後台 `nuxt.config.ts` 加上 `extends: ['@mono/ui']`
- 移除：`apps/*/app/components/Base*.vue`、各 app 重複的 body / table 全域樣式
- 新增 `apps/admin/app/assets/theme.css`：只覆寫 `--c-primary`，後台變藍色
- 新增 [ADR 0003](./docs/adr/0003-ui-nuxt-layer.md)

### 學到的設計觀念
- **共用「機制」，允許「設定」不同**：元件只有一份，主題差異透過 token 覆寫。
- **Layer vs 元件庫 vs Module**：Layer 是 Nuxt 專案間共用的最低成本方案（見 ADR 0003）。
- **依賴方向開始成形**：`apps → ui → core`，箭頭只能往下。
- Layer 中的路徑必須是絕對路徑，否則會以使用端 app 為基準解析。

### 如何驗證
```bash
pnpm install && pnpm typecheck && pnpm build
```
- 前台 HTML 中可看到 `ui-card`、`ui-price` 元件輸出
- 後台 CSS 先載入 layer 的 `--c-primary:#00a86b`，再被 theme.css 覆寫為 `#2563eb`

## [step-03] 抽出 `@mono/core`（領域型別 + 業務規則）

### 動機
解決痛點 #2、#3：`Product` 型別寫兩次、`formatPrice` 已分歧、業務規則散落在各 handler。

### 變更
- 新增 `packages/tsconfig`（`@mono/tsconfig`）：非 Nuxt 套件共用的 TS 設定
- 新增 `packages/core`（`@mono/core`）：
  - `Product`、`ApiResponse<T>` 型別
  - 業務規則 `isOnStorefront()`、`isSoldOut()`、`storefrontProducts()`
  - 統一的 `formatPrice()`（採用前台的 Intl 版本）
- 前後台改為 `import ... from '@mono/core'`；handler 與頁面改用業務規則函式
- 移除：`apps/*/shared/types/product.ts`、`apps/*/shared/utils/format.ts`
- **保留**：`apps/admin/shared/types/user.ts`（只有後台用，不該搬）、各 app 的假資料（留待 step-06）
- 新增 [ADR 0002](./docs/adr/0002-core-package-jit.md)

### 學到的設計觀念
- **抽出的判斷標準**：兩個以上 app 使用 + 與框架無關。只有一個使用者的東西留在原地。
- **Just-in-Time 套件**：`exports` 直接指向 `.ts`，不需 build；Vite/Nitro 會轉譯 workspace 套件。
- **業務規則是最該共用的東西**，比 UI 元件更重要 —— 規則不一致會造成資料錯誤，UI 不一致只是難看。

### 動手實驗
在 `packages/core/src/product.ts` 的 `Product` 加上 `sku: string`，執行 `pnpm typecheck`：
```
apps/web   typecheck: server/data/products.ts(5,3): error TS2741: Property 'sku' is missing ...
apps/admin typecheck: server/data/products.ts(5,3): error TS2741: Property 'sku' is missing ...
```
**一次修改、兩邊同時被型別系統抓到** —— 這是 step-01 做不到的。

### 如何驗證
```bash
pnpm install && pnpm typecheck && pnpm build
```

## [step-02] 導入 pnpm workspace

### 動機
解決痛點 #1、#5：兩份 lockfile、版本可能漂移、每個指令都要分別 `cd` 進去執行。

### 變更
- 新增根目錄 `package.json`：`packageManager` 鎖定 pnpm 版本；scripts 用 `pnpm -r` / `--filter` 統一操作
- 新增根目錄 `pnpm-workspace.yaml`：宣告 `apps/*`、`packages/*`；**catalog** 統一版本；`allowBuilds` 集中設定
- 子專案依賴全部改為 `"catalog:"`；套件名改為 scope 形式 `@mono/web`、`@mono/admin`
- 移除：`apps/*/pnpm-lock.yaml`、`apps/*/pnpm-workspace.yaml`（合併成根目錄一份）
- 新增 [ADR 0001](./docs/adr/0001-pnpm-workspace.md)

### 學到的設計觀念
- **Single Version Policy**：同一個 repo 內同一依賴只有一個版本，避免「前台 Nuxt 4.6、後台 Nuxt 4.2」的漂移。
- **Scope 命名**（`@mono/*`）：一眼區分內部套件與第三方套件，也方便 `--filter '@mono/*'`。
- `pnpm -r` 只是「在每個套件裡跑同一個指令」，**沒有快取、也不懂任務之間的依賴** —— 這是 step-05 要解決的。

### 仍存在的痛點
程式碼仍然重複（#2、#3、#4）、資料仍不共享（#6）、每次 build 都從頭來。

### 如何驗證
```bash
pnpm install       # 根目錄一次安裝全部
pnpm typecheck     # = pnpm -r typecheck
pnpm build         # 每次都完整重建兩個 app（注意花費時間，step-05 會對比）
```

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

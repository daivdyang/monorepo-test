# Changelog

本教學每個步驟對應一個 git tag（`step-XX`），最新的在最上面。
每一節都包含：**動機**（遇到什麼問題）→ **變更** → **學到的設計觀念** → **如何驗證**。

<!-- next -->

## [step-09] CI 與部署（GitHub Actions + `turbo prune` + Docker）

### 動機
讓前面建立的規則在每個 PR 自動執行，並且每個 app 能**獨立**建置成最小的部署映像。

### 變更
- 新增 `.github/workflows/ci.yml`：`fetch-depth: 0`、`turbo boundaries`、PR 用 `--affected`、main 全量
- 新增 `Dockerfile`（`--build-arg APP=web|admin`）：prune → install → build → runner 四階段
- 新增 `.dockerignore`
- **修正隱性依賴**：`packages/ui` 新增 `prepare:nuxt` script；`turbo.json` 新增 `prepare:nuxt` 任務，
  `build.dependsOn` 加上 `^prepare:nuxt`
- 新增 [ADR 0008](./docs/adr/0008-ci-and-deployment.md)

### 學到的設計觀念
- **`turbo prune --docker`** 將 repo 切成 `json/`（只有 package.json + lockfile）與 `full/`（原始碼），
  讓 Docker 的依賴安裝層只在依賴改變時才失效。
- **隱性依賴要寫進任務圖**：本機能動是因為 postinstall 剛好產生了 `packages/ui/.nuxt/`；
  在乾淨環境（`--ignore-scripts`）就壞了。修在任務圖，而不是部署腳本。
- **環境差異**：非 root 使用者的 volume 權限、production 的 Secure cookie 需要 HTTPS。

### 實測過程
1. 第一次 `docker build --build-arg APP=admin` 失敗：
   `Failed to load tsconfig '../../packages/ui/.nuxt/tsconfig.app.json': Tsconfig not found`
2. 加入 `prepare:nuxt` 任務後建置成功；本機 `pnpm build` 第二次仍為 2 cached（prepare 本身不快取，約 0.4 秒）
3. 兩個容器掛載同一個 volume：

| 動作 | 結果 |
|---|---|
| 前台 `/api/products` | total 3 |
| 後台（`NUXT_ADMIN_PASSWORD=s3cret`）登入並下架商品 1 | 成功，cookie 帶 `Secure` |
| 前台 `/api/products/1` | 404，total 2 |

### 如何驗證
```bash
docker build --build-arg APP=web   -t mono-web .
docker build --build-arg APP=admin -t mono-admin .
docker run -d -p 3000:3000 -v mono-data:/data mono-web
docker run -d -p 3001:3000 -v mono-data:/data -e NUXT_ADMIN_PASSWORD=*** mono-admin
```

## [step-08] 測試與 `--affected`（只測受影響的套件）

### 動機
共用套件的修改會影響多個 app。需要 (1) 用測試鎖住規則，(2) 只跑受影響的部分，讓 CI 時間不隨 repo 長大而爆炸。

### 變更
- catalog 新增 `vitest`
- `packages/core`：`product.test.ts`（業務規則）、`format.test.ts`（鎖住統一後的價格格式）
- `packages/db`：`products.test.ts`（`:memory:` SQLite；含「db + core 規則」的跨套件整合測試）
- `turbo.json` 新增 `test` 任務（`dependsOn: ["transit"]`）
- 根目錄 scripts：`test`；`check` 加入 test；新增 `check:affected`
- 新增 [ADR 0007](./docs/adr/0007-testing-strategy.md)

### 學到的設計觀念
- **測試放在最靠近規則的地方**：規則在 core，就在 core 測；不必啟動 Nuxt 就能驗證業務邏輯 ——
  這是 step-03「core 必須與框架無關」的另一個回報。
- **`--affected` = git diff × 依賴圖**：只改 db 時，core 不需要重測；只改 admin 時，web 完全不動。
- **turbo 看不到依賴圖之外的耦合**（例如共用 DB 檔）—— 這類風險要靠 db 套件的測試把關。

### 動手實驗（已實測，基於乾淨的 HEAD）
```bash
echo "//" >> packages/db/src/seed.ts
npx turbo run lint typecheck test build --affected --dry
```
| 修改位置 | 被選到的任務 |
|---|---|
| `packages/db` | db#test、db#typecheck、web/admin 的 build、lint、typecheck（core 不在內） |
| `apps/admin` | admin#build、admin#lint、admin#typecheck |
| `packages/ui` | ui#lint、ui#typecheck、web/admin 的 build、lint、typecheck |
| 無變更 | （無） |

### 如何驗證
```bash
pnpm test      # core 4 tests、db 5 tests 全部通過
pnpm check     # boundaries + lint + typecheck + test：10/10
```

## [step-07] 強制依賴邊界（turbo boundaries + ESLint）

### 動機
依賴方向（apps → ui → core、db 為 server-only）至今只寫在文件與註解裡。
**沒有被工具強制的設計，終究會被打破。**

### 變更
- 每個套件新增 `turbo.json` 並標上 tag：`app`、`ui`、`core`、`server-only`、`config`
- 根目錄 `turbo.json` 新增 `boundaries.tags` 規則（見 ADR 0006）與 `lint` 任務（`dependsOn: ["transit"]`）
- 新增 `packages/eslint-config`（`@mono/eslint-config`）：
  基於 `@nuxt/eslint-config/flat`，加上「`app/` 不可 import `@mono/db`、`node:*`」規則
- web / admin / ui 新增 `eslint.config.js` 與 `lint` script
- 根目錄新增 scripts：`lint`、`boundaries`、`check`（boundaries + lint + typecheck）
- **修正**：`apps/admin` 補上 `h3` 依賴（catalog 釘在 `^1.15.11`，與 nuxt 內部一致）
- 新增 [ADR 0006](./docs/adr/0006-enforce-boundaries.md)

### 學到的設計觀念
- **兩層邊界**：套件層級（誰可以依賴誰）+ 檔案層級（同一套件內的 client / server 區分）。
- **Phantom dependency**：pnpm 已經比 npm 嚴格，但 Nuxt 會把 h3 等型別暴露出來，
  直接 import 仍然能動 —— `turbo boundaries` 一導入就抓到了。
- **補依賴時要對齊版本**：`pnpm add h3` 會裝到 2.x，與 nuxt 內部的 1.x 型別不相容。
- **設定也是套件**：ESLint 規則放在 `@mono/eslint-config`，所有 Nuxt 套件共用。

### 動手實驗（已實測）
| 違規 | 被誰抓到 | 訊息 |
|---|---|---|
| `packages/ui` 依賴並 import `@mono/db` | turbo boundaries | `Package @mono/db found without any tag listed in allowlist for @mono/ui` |
| `apps/web/app/pages/index.vue` import `@mono/db` | ESLint | `@mono/db 是 server-only，請在 server/ 內使用…` |
| `apps/web/app/composables/*.ts` import `node:fs` | ESLint | `app/ 會在瀏覽器執行，不可使用 Node 內建模組。` |
| `apps/web/server/utils/db.ts` import `@mono/db` | — | 合法，不報錯 |

### 如何驗證
```bash
pnpm check     # boundaries: no issues found；lint + typecheck: 8/8 成功
```

## [step-06] 共享資料層 `@mono/db`（解決前後台資料不同步）

### 動機
解決痛點 #6：後台下架商品，前台完全不知道。原因是兩個 Nitro 行程各自一份記憶體 ——
這是架構問題：**資料的唯一來源在哪裡？**（三種方案比較見 ADR 0005）

### 變更
- 新增 `packages/db`（`@mono/db`），使用 Node 24 內建 `node:sqlite`：
  - `client.ts`：`createDb()` / `getDb()`，啟用 WAL 與 busy_timeout（兩個行程同時存取）
  - `schema.ts`、`seed.ts`：建表與初始資料（取代各 app 的假資料）
  - `products.ts`：`createProductRepo()` —— 只負責存取，不負責規則
- 前後台：
  - `runtimeConfig.dbPath` 指向 repo 根目錄 `.data/mono.db`（可用 `NUXT_DB_PATH` 覆寫）
  - `server/utils/db.ts`：`useProductRepo()`（Nitro 自動 import）
  - `nitro.rollupConfig.external: ['node:sqlite']`：消除 Nitro 無法解析內建模組的警告
- 後台 PATCH 改為白名單欄位（`name` 等其他欄位會被忽略）
- 移除：`apps/*/server/data/products.ts`
- 新增 [ADR 0005](./docs/adr/0005-shared-data-layer.md)

### 學到的設計觀念
- **規則（core）與存取（db）分離**：前台的組合方式是 `storefrontProducts(repo.list())`；
  不在 SQL 寫 `WHERE published = 1`，避免同一條規則存在兩處。
- **Server-only 套件**：`@mono/db` 只能在 `server/` 使用，這條邊界目前只靠自律 → step-07 用工具強制。
- **部署與設定相關**：`dbPath` 的預設值在 build 時被寫成絕對路徑，正式環境必須用環境變數指定。

### 如何驗證（已實測）
```bash
pnpm build
PORT=4000 node apps/web/.output/server/index.mjs &
PORT=4001 node apps/admin/.output/server/index.mjs &
```
| 動作 | 結果 |
|---|---|
| 前台 `GET /api/products` | total 3 |
| 後台登入後 `PATCH /api/products/1 {published:false}` | 成功 |
| 前台 `GET /api/products/1` | **404**（step-05 以前是 200） |
| 前台 `GET /api/products` | total 2 |
| 後台 `PATCH {name:"hacked"}` | 被忽略 |
| 未登入 `PATCH` | 401 |

## [step-05] 導入 Turborepo（任務圖 + 快取）

### 動機
`pnpm -r build` 每次都完整重建；不知道任務先後順序，也不知道哪些可以跳過。

### 變更
- 新增 `turbo.json`：`build`、`typecheck`、`dev`、`transit` 四個任務
- 根目錄 scripts 改為 `turbo run ...`；新增 `build:web` / `build:admin`（`--filter=@mono/web...`）
- catalog 新增 `turbo`
- 新增 [ADR 0004](./docs/adr/0004-turborepo-task-graph.md)

### 學到的設計觀念
- **`^build` vs `transit`**：任務需要依賴的「產出」就用 `^task`；只需要依賴的「原始碼」就用 `transit`。
- **快取正確性比快取命中率重要**。實測發現 typecheck 若設為 `dependsOn: []`：
  修改 core 後 web/admin 的 typecheck **仍命中快取**，型別錯誤被隱藏。改用 `transit` 後才正確失效。
- `outputs` 只放真正的產物（`.output/**`），不放 `.nuxt/` 中間檔。
- `env` 要列出 build 時讀取的環境變數（`NUXT_*`），`.env` 是放在各 app 目錄而非根目錄。

### 動手實驗
```bash
pnpm build                   # 第一次：2 cached 0
pnpm build                   # 第二次：FULL TURBO（7ms）
echo "//" >> packages/core/src/format.ts
pnpm build                   # web、admin 都 cache miss —— 因為都依賴 core
npx turbo run build --graph  # 輸出任務圖（DOT 格式）
```
只改 `apps/admin` 時，只有 `@mono/admin:typecheck` 是 cache miss，其他三個都命中。

### 如何驗證
```bash
pnpm install && pnpm typecheck && pnpm build && pnpm build   # 最後一次應為 FULL TURBO
```

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

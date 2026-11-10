# Mono Test — Nuxt 4 Monorepo 設計教學

一步步把「兩個各自為政的 Nuxt app」演進成「設計良好的 monorepo」。
重點不在「怎麼設定」，而在**每個設計決策為什麼這樣做、代價是什麼**。

- 技術：Nuxt 4 · pnpm workspace（catalog）· Turborepo · Nuxt Layer · node:sqlite · Vitest · ESLint
- 系統：前台 `@mono/web`（3000，公開商店）、後台 `@mono/admin`（3001，需登入的管理系統）

## 文件導覽

| 文件 | 內容 |
|---|---|
| 本 README | 最終架構、流程、設計原則、注意事項 |
| [CHANGELOG.md](./CHANGELOG.md) | 每一步的動機 → 變更 → 設計觀念 → 實測結果 |
| [docs/adr/](./docs/adr/README.md) | 架構決策紀錄：每個決策考慮過的選項與取捨 |
| [docs/conversation.md](./docs/conversation.md) | 建立本專案的完整對話紀錄 |

## 學習路徑

每一步都是一個 git tag，可以切換過去觀察或比較差異：

```bash
git checkout step-01          # 從頭開始
git diff step-02 step-03      # 這一步改了什麼
git checkout main             # 回到最終版
```

| Tag | 主題 | 解決的問題 | 核心觀念 | ADR |
|---|---|---|---|---|
| step-01 | 兩個獨立 app | —（刻意製造痛點） | 「同一個 repo」≠ monorepo | — |
| step-02 | pnpm workspace | 兩份 lockfile、版本漂移 | Single Version Policy（catalog） | [0001](./docs/adr/0001-pnpm-workspace.md) |
| step-03 | `@mono/core` | 型別重複、`formatPrice` 分歧 | 什麼該抽出；Just-in-Time 套件 | [0002](./docs/adr/0002-core-package-jit.md) |
| step-04 | `@mono/ui` | 元件重複、樣式分歧 | 共用機制、允許設定不同（token） | [0003](./docs/adr/0003-ui-nuxt-layer.md) |
| step-05 | Turborepo | 每次全量重建 | 任務圖；`transit` 保證快取正確 | [0004](./docs/adr/0004-turborepo-task-graph.md) |
| step-06 | `@mono/db` | 前後台資料不同步 | 資料唯一來源；規則與存取分離 | [0005](./docs/adr/0005-shared-data-layer.md) |
| step-07 | 邊界強制 | 依賴規則只靠自律 | 套件層級 + 檔案層級兩層邊界 | [0006](./docs/adr/0006-enforce-boundaries.md) |
| step-08 | 測試 | 共用修改的回歸風險 | 測試靠近規則；`--affected` | [0007](./docs/adr/0007-testing-strategy.md) |
| step-09 | CI 與部署 | 全量 CI、肥大映像 | `turbo prune`；隱性依賴寫進任務圖 | [0008](./docs/adr/0008-ci-and-deployment.md) |
| step-10 | 文件 | — | 架構總覽與對話紀錄 | — |

## 快速開始

```bash
corepack enable          # 依 package.json 的 packageManager 使用 pnpm 12
pnpm install             # 安裝全部依賴，並對 Nuxt 套件執行 nuxt prepare
pnpm dev                 # 同時啟動前台 :3000 與後台 :3001（預設密碼 admin123）
pnpm check               # 依賴邊界 + lint + typecheck + test
pnpm build               # 建置（有快取，第二次為 FULL TURBO）
```

需求：Node.js `>=24.15`（`node:sqlite` 為內建模組）。
資料存放於 `.data/mono.db`，首次啟動自動建立並寫入初始資料；刪除即可重置。

---

## 一、最終架構

```
mono_test/
├─ apps/                       可部署的應用（tag: app）
│  ├─ web/                     前台：SSR、SEO、只顯示已上架商品
│  │  ├─ app/                  瀏覽器 + SSR 程式碼（不可 import @mono/db）
│  │  └─ server/               Nitro API（可 import @mono/db）
│  └─ admin/                   後台：登入、noindex、商品上下架
│     ├─ app/                  layouts / middleware / composables / pages
│     ├─ shared/types/user.ts  只有後台用的型別 → 留在 app 內，不進 core
│     └─ server/               auth、products API
├─ packages/                   共用套件（不單獨部署）
│  ├─ core/        @mono/core       領域型別 + 業務規則（純 TS）         tag: core
│  ├─ ui/          @mono/ui         Nuxt Layer：元件 + 設計 token        tag: ui
│  ├─ db/          @mono/db         SQLite 資料存取（server-only）       tag: server-only
│  ├─ tsconfig/    @mono/tsconfig   共用 TS 設定                         tag: config
│  └─ eslint-config/ @mono/eslint-config  共用 lint + 邊界規則           tag: config
├─ docs/adr/                   架構決策紀錄
├─ pnpm-workspace.yaml         成員、catalog（版本）、allowBuilds
├─ turbo.json                  任務圖、快取規則、boundaries
├─ Dockerfile                  APP=web|admin，turbo prune 多階段建置
└─ .github/workflows/ci.yml    PR 跑 --affected
```

### 依賴分層（上層可以依賴下層，反之不行）

```
 層級            套件                                         可依賴
 ─────────────────────────────────────────────────────────────────────────
 app            @mono/web        @mono/admin                 ui、db、core、config
                    │   ╲          ╱   │
                    │    ╲        ╱    │
 ui / db        @mono/ui      @mono/db（只能在 server/ 用）     core、config
                     ╲          ╱
 core                 @mono/core                             config
 config         @mono/tsconfig · @mono/eslint-config         —
```

- app 透過 `extends` 使用 ui（Nuxt Layer），在 `server/` 中 import db，兩處都可 import core。
- ui 與 db 彼此不知道對方：呈現與資料存取互相獨立。

| 規則 | 由誰強制 |
|---|---|
| 沒有套件可依賴 app；core 只依賴 config；ui / db 只依賴 core、config | `turbo boundaries`（tags） |
| import 的套件必須在 package.json 宣告；不可用相對路徑跨出套件 | `turbo boundaries` |
| `app/**` 不可 import `@mono/db`、`node:*` | ESLint（`@mono/eslint-config`） |

### 任務圖（turbo.json）

| 任務 | dependsOn | 為什麼 |
|---|---|---|
| `build` | `^build`、`^prepare:nuxt` | 依賴的 layer 必須先產生 `.nuxt/`（step-09 實測發現） |
| `typecheck` / `lint` / `test` | `transit` | 不需等依賴先跑完（平行），但依賴原始碼改變時快取要失效 |
| `prepare:nuxt` | — | `cache: false`，產物含絕對路徑 |
| `dev` | — | `persistent`、不快取 |

---

## 二、執行流程

### 前台：SSR 請求

```
瀏覽器 GET /
  → Nitro SSR 執行 app/pages/index.vue
  → useFetch('/api/products') 在伺服器端直接呼叫 handler（不走網路）
      → useProductRepo().list()          @mono/db  讀取 SQLite
      → storefrontProducts(list)         @mono/core 套用「只顯示已上架」規則
  → 渲染 HTML（<UiCard> <UiPrice> 來自 @mono/ui），資料序列化進 payload
  → 瀏覽器 hydration 重用 payload，不會重複請求
```

### 後台：登入與修改

```
未登入 GET /products
  → app/middleware/auth.global.ts → GET /api/auth/me → 401
  → 302 /login?redirect=/products
POST /api/auth/login（比對 NUXT_ADMIN_PASSWORD）
  → setCookie(httpOnly, Secure in production) → 導回 redirect
PATCH /api/products/1 { published: false }
  → requireAdmin(event)                  真正的安全邊界在 server
  → 白名單欄位 → useProductRepo().update()
  → 同一個 SQLite 檔 → 前台下一次請求立即看到變化
```

### 開發與交付

```
pnpm install ─▶ postinstall: nuxt prepare（IDE 型別）
pnpm dev     ─▶ turbo: web:dev ∥ admin:dev；改 packages/* 兩邊同時 HMR
PR           ─▶ CI: boundaries → lint/typecheck/test/build --affected
部署         ─▶ docker build --build-arg APP=admin
                 prune（只取 admin 需要的）→ install（可快取）→ build → 只帶 .output
```

---

## 三、設計原則

1. **先有痛點，再有抽象。** 第二個使用者真正出現時才抽出共用套件；只有一個使用者的東西留在原地（`AdminUser` 留在 admin）。
2. **依賴只能往下，且必須由工具強制。** 文件上的規則會被打破，CI 上的規則不會。
3. **規則、存取、呈現分離。** core 決定「什麼是對的」，db 決定「資料在哪」，ui 決定「長什麼樣」，app 負責組合。
4. **共用機制，允許設定不同。** 元件只有一份，主題差異透過設計 token 覆寫。
5. **Single Version Policy。** 核心依賴版本在 catalog 只定義一次；升級時一起升、一起測。
6. **快取正確性優先於命中率。** 寧可多跑一次，也不能重播錯誤的結果（`transit`）。
7. **隱性依賴寫進任務圖。** 「本機能動」不代表正確；乾淨環境（CI、Docker）才是標準。
8. **每個決策都留下 ADR。** 半年後的人（包括你自己）需要知道當初為什麼這樣選。

---

## 四、注意事項

### 依賴管理
- 在正確的位置安裝：`pnpm add dayjs --filter @mono/web`；根目錄工具用 `pnpm add -D xxx -w`。
- 新的共用版本放進 catalog，子專案寫 `"catalog:"`。
- **補依賴時版本要與框架內部一致**：例如 `h3` 必須是 nuxt 使用的 1.x，npm latest 是 2.x（step-07）。
- 需要原生 binary 的新依賴要加入 `allowBuilds`，否則 `ERR_PNPM_IGNORED_BUILDS`。
- 安裝狀態異常或切換 tag 後，可用 `pnpm clean:modules && pnpm install` 重來；pnpm 的全域 store 不受影響，重裝很快。

### Turborepo
- 新任務要想清楚：需要依賴的「產出」用 `^task`；只需要「原始碼」用 `transit`。
- 若設 `dependsOn: []`，修改 core 後 web 的 typecheck 會命中舊快取、隱藏錯誤（step-05 實測）。
- build 時讀取的環境變數要列在 `env`（本專案 `NUXT_*`）；`.env` 位於各 app 目錄。
- 新增套件記得加上 `turbo.json` 的 `tags`，否則不受邊界規則約束。

### Nuxt
- clone 後先 `pnpm install`，`.nuxt/` 型別由 postinstall 產生。
- Layer 內路徑必須是絕對路徑；app 內同名元件會覆蓋 layer 元件。
- `runtimeConfig.public` 會送到瀏覽器，密鑰只能放頂層並以 `NUXT_*` 環境變數注入。
- `dbPath` 預設值在 build 時寫成絕對路徑，部署務必設定 `NUXT_DB_PATH`。
- `DEMO_TOKEN` 僅供教學，正式環境請改用 [nuxt-auth-utils](https://github.com/atinux/nuxt-auth-utils) 或 JWT。

### 部署
- production 的登入 cookie 帶 `Secure`，必須走 HTTPS。
- 容器以非 root 執行，volume 目錄需先 `chown`。
- SQLite + volume 僅適用單機；多台主機改用網路資料庫，只需修改 `@mono/db`。

---

## 五、常用指令

| 指令 | 說明 |
|---|---|
| `pnpm dev` / `dev:web` / `dev:admin` | 啟動開發伺服器 |
| `pnpm build` / `build:web` / `build:admin` | 建置（`--filter=@mono/xxx...` 含依賴） |
| `pnpm check` | boundaries + lint + typecheck + test |
| `pnpm check:affected` | 同上，但只跑受影響的套件，並加上 build |
| `pnpm clean:modules` | 刪除根目錄與所有 workspace 成員的 `node_modules`（不碰 `.output`），之後 `pnpm install` 重裝 |
| `npx turbo run build --graph` | 輸出任務圖 |
| `npx turbo run test --affected --dry` | 預覽哪些任務會被執行 |
| `npx turbo prune @mono/admin --docker` | 取出 admin 需要的子集合 |

# Mono Test — Nuxt 4 Monorepo 設計教學

一步步把「兩個各自為政的 Nuxt app」演進成「設計良好的 monorepo」。
每個步驟都是一個 git tag，可以隨時切換觀察：

```bash
git tag -l 'step-*'          # 列出所有步驟
git checkout step-01         # 切到某一步
git diff step-01 step-02     # 看這一步改了什麼
```

每一步的動機、變更與學到的事，請看 [CHANGELOG.md](./CHANGELOG.md)。

## 目前狀態：step-08

前台 `apps/web`（3000）與後台 `apps/admin`（3001）已納入 pnpm workspace，從根目錄統一操作：

```bash
pnpm install
pnpm dev          # 同時啟動前後台（後台預設密碼 admin123）
pnpm dev:web      # 只啟動前台
pnpm build        # Turborepo 建置（有快取）
pnpm typecheck
pnpm test
pnpm check        # 依賴邊界 + lint + typecheck + test
```

共用程式碼：`packages/core`（型別、業務規則）、`packages/ui`（Nuxt Layer：元件與設計 token）、`packages/db`（SQLite 資料層，server-only）、`packages/tsconfig`。

前後台共用 `.data/mono.db`（首次啟動自動建立並寫入初始資料，刪除即可重置）。

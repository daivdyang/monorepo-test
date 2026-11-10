# 架構決策紀錄（ADR）

每份 ADR 記錄一個設計決策：**背景 → 考慮過的選項 → 決定 → 後果（含代價）**。
ADR 一旦接受就不改內容；若決策改變，新增一份 ADR 並將舊的標為「已取代」。

| 編號 | 決策 | 引入於 |
|---|---|---|
| [0001](./0001-pnpm-workspace.md) | 使用 pnpm workspace + catalog 管理依賴 | step-02 |
| [0002](./0002-core-package-jit.md) | 抽出 @mono/core，採 Just-in-Time 內部套件 | step-03 |
| [0003](./0003-ui-nuxt-layer.md) | 以 Nuxt Layer 共用 UI，設計 token 支援主題 | step-04 |
| [0004](./0004-turborepo-task-graph.md) | 以 Turborepo 編排任務，transit 節點保證快取正確 | step-05 |
| [0005](./0005-shared-data-layer.md) | 共享資料層：前後台共用 @mono/db | step-06 |
| [0006](./0006-enforce-boundaries.md) | 以工具強制依賴邊界（套件 + 檔案層級） | step-07 |

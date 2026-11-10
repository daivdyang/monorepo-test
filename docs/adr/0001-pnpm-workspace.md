# 0001 使用 pnpm workspace + catalog 管理依賴

- 狀態：已接受
- 引入於：step-02

## 背景
前後台各自安裝依賴，產生兩份 lockfile；Nuxt 版本可以各自升級而漂移，
而 Nuxt Layer（step-04）要求使用端與 layer 的 Nuxt 版本一致。

## 選項
| 選項 | 優點 | 缺點 |
|---|---|---|
| npm workspaces | 內建、零安裝 | 依賴提升（hoist）導致 phantom dependency；無 catalog |
| Yarn (Berry) workspaces | PnP 嚴格、constraints | PnP 與部分工具相容性差、學習成本高 |
| **pnpm workspace** | 嚴格的 node_modules（無 phantom dependency）、content-addressable store 省空間、catalog、`--filter` | 少數工具假設依賴被提升 |

## 決定
採用 pnpm workspace，並以 **catalog** 實施 Single Version Policy：
`nuxt`、`vue`、`typescript` 等核心依賴版本只在 `pnpm-workspace.yaml` 定義一次。

## 後果
- ✅ 全 repo 一份 lockfile，一次 `pnpm install` 完成
- ✅ 內部套件用 `workspace:*` 連結，修改立即生效
- ✅ allowBuilds 等安全設定集中管理
- ⚠️ 升級 Nuxt 時所有 app 必須一起升級並一起測試（這是刻意的取捨）
- ⚠️ 未在 package.json 宣告的依賴 import 不到，必須在正確的子專案 `pnpm add --filter`

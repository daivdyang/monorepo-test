# 0004 以 Turborepo 編排任務，並用 transit 節點保證快取正確

- 狀態：已接受
- 引入於：step-05

## 背景
`pnpm -r build` 每次都完整重建所有套件，不知道「哪些東西沒變可以跳過」，
也不知道任務之間的先後關係。隨著套件增加，CI 時間會線性成長。

## 選項
| 選項 | 優點 | 缺點 |
|---|---|---|
| `pnpm -r` / `--filter` | 零依賴 | 無快取、無任務圖 |
| Nx | 功能完整（generators、graph UI、affected） | 概念多、侵入性高 |
| **Turborepo** | 設定只有一個 turbo.json、本地 + 遠端快取、`--filter` / `--affected` | 功能較 Nx 精簡 |

## 決定：任務圖設計
```jsonc
"build":     { "dependsOn": ["^build"], "outputs": [".output/**"], "env": ["NUXT_*"] }
"typecheck": { "dependsOn": ["transit"] }
"transit":   { "dependsOn": ["^transit"] }   // 沒有任何套件有 transit script
"dev":       { "cache": false, "persistent": true }
```

### 為什麼 typecheck 需要 transit？（已實測）
typecheck 本身**不需要等**依賴套件先 typecheck 完（JIT 套件直接讀原始碼），
所以不該寫 `^typecheck`，否則會失去平行化。
但若寫成 `dependsOn: []`，turbo 計算 web#typecheck 的 hash 時**不會納入 core 的原始碼**：

| 設定 | 修改 core 後 web#typecheck |
|---|---|
| `dependsOn: []` | ❌ **cache hit**（重播舊結果，型別錯誤被隱藏！） |
| `dependsOn: ["transit"]` | ✅ cache miss，重新檢查 |

`transit` 是一個「不存在的任務」，只用來把依賴套件的 hash 串進來，
達成「可以平行執行」又「依賴變了就失效」。

### 其他細節
- `build.outputs` 只列 `.output/**`；`.nuxt/` 是中間產物，不快取
- `env: ["NUXT_*"]`：Nuxt 在 build 時讀取的環境變數必須納入 hash，否則換環境仍命中舊快取
- `inputs` 加上 `.env*`：Nuxt 讀的是**各 app 目錄下**的 `.env`，不是 repo 根目錄

## 後果
- ✅ 沒變的套件直接還原（FULL TURBO，毫秒級）
- ✅ `--filter=@mono/web...` 只建置前台及其依賴
- ⚠️ 新增任務時必須思考：它需要依賴的「結果」（用 `^task`）還是只需要依賴的「原始碼」（用 `transit`）？
- ⚠️ 未列入 `env` 的環境變數改變不會讓快取失效

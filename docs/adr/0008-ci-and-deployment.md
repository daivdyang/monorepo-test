# 0008 CI 只跑受影響範圍；部署以 turbo prune 產生單一 app 的最小映像

- 狀態：已接受
- 引入於：step-09

## 背景
monorepo 的兩個常見陷阱：
1. CI 每次都跑全部套件，越來越慢。
2. 部署某個 app 時把整個 repo 複製進 Docker，任何套件變動都讓所有映像的快取失效。

## 決定
### CI（`.github/workflows/ci.yml`）
- `fetch-depth: 0`：`--affected` 需要比較基準分支
- `turbo boundaries` 全量執行（快，且規則本身可能改變）
- PR 用 `--affected`；push 到 main 全量執行

### 部署（`Dockerfile`，以 `APP` build arg 選擇 web / admin）
| Stage | 做什麼 | 為什麼 |
|---|---|---|
| pruner | `turbo prune @mono/${APP} --docker` | 只取出該 app 依賴的套件（admin 不含 apps/web） |
| installer | 只複製 `out/json`（package.json + lockfile）後 `pnpm install --ignore-scripts` | 原始碼變動不會讓依賴安裝層失效 |
| builder | 複製 `out/full` 後 `turbo run build --filter` | — |
| runner | 只複製 `apps/${APP}/.output` | Nitro 已把依賴打包，不需要 node_modules |

## 實測中發現的隱性依賴
Docker 建置失敗：`Failed to load tsconfig '../../packages/ui/.nuxt/tsconfig.app.json'`。
原因：建置 admin 時，rolldown 轉譯 layer 的檔案會讀取 `packages/ui/tsconfig.json`，
它參照 `packages/ui/.nuxt/`，而這個目錄原本由 **postinstall** 產生 —— 本機一直存在，所以從未出錯。

**錯誤的修法**：在 Dockerfile 移除 `--ignore-scripts` 或手動跑 `nuxt prepare`（把知識藏在部署腳本裡）。
**正確的修法**：把依賴寫進任務圖：
```jsonc
"prepare:nuxt": { "cache": false },                       // ui 的 script: nuxt prepare
"build": { "dependsOn": ["^build", "^prepare:nuxt"], ... }
```
如此 CI、Docker、本機乾淨 clone 都會得到相同結果。

## 其他部署注意事項
- `NUXT_DB_PATH=/data/mono.db` + volume；`/data` 先 `chown node`，否則非 root 無法寫入
- production 時登入 cookie 帶 `Secure`，正式環境必須走 HTTPS
- 以 `NUXT_ADMIN_PASSWORD` 注入密碼（runtime 環境變數，不需重新建置）

## 後果
- ✅ 已實測：web、admin 映像皆可建置；兩個容器共用 volume，後台下架 → 前台 404
- ✅ admin 映像不含 apps/web 任何檔案
- ⚠️ SQLite + volume 只適用單機；多台主機需改用網路資料庫（只需修改 @mono/db）

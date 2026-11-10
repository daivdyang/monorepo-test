# 0005 共享資料層：前後台共用 @mono/db

- 狀態：已接受
- 引入於：step-06

## 背景
step-01 ~ step-05 中，前後台各有一份 in-memory 假資料。
後台下架商品後前台完全不受影響 —— 因為**兩個 Nitro 行程的記憶體不共享**。
這不是 bug，而是架構問題：「資料的唯一來源（source of truth）在哪裡？」

## 選項
```
A. 共用資料存取套件      B. 獨立 API 服務            C. 各自 BFF + 共用 API
┌─────┐  ┌───────┐       ┌─────┐  ┌───────┐        ┌─────┐  ┌───────┐
│ web │  │ admin │       │ web │  │ admin │        │ web │  │ admin │
└──┬──┘  └───┬───┘       └──┬──┘  └───┬───┘        │ BFF │  │  BFF  │
   └─@mono/db┘              └──HTTP───┘            └──┬──┘  └───┬───┘
        │                        │                    └──HTTP───┘
     [ DB ]                 ┌────▼────┐               ┌────▼────┐
                            │apps/api │               │apps/api │
                            └────┬────┘               └────┬────┘
                              [ DB ]                     [ DB ]
```
| 選項 | 優點 | 缺點 | 適合 |
|---|---|---|---|
| **A. 共用 `packages/db`** | 最簡單；型別端到端；無網路開銷 | 兩個 app 都直接連 DB；schema 變更影響兩邊 | 小型團隊、同一組人維護前後台 |
| B. 獨立 `apps/api` | 單一寫入點；可給 App / 第三方使用 | 多一個服務要部署；需設計 API 版本 | 有行動 App 或多個消費者 |
| C. BFF + API | 前端各自聚合資料；後端穩定 | 最複雜 | 大型組織、多團隊 |

## 決定
採用 **A**，以 Node 24 內建的 `node:sqlite` 實作（零原生依賴，不需 allowBuilds）。

### 職責切分
| 套件 | 負責 | 不負責 |
|---|---|---|
| `@mono/core` | 規則：什麼商品能在前台顯示 | 資料從哪來 |
| `@mono/db` | 存取：讀寫 products 表 | 規則判斷（不在 SQL 寫 `WHERE published = 1`） |
| `apps/*/server` | 組合：`storefrontProducts(repo.list())`、驗證、權限 | — |

## 後果
- ✅ 後台修改立即反映到前台（已驗證：下架 -> 前台 404、total 3 -> 2）
- ✅ 業務規則仍只有一份（core），沒有在 SQL 中重複
- ⚠️ `@mono/db` 是 **server-only**，若被 `app/` import 會把 node:sqlite 打包進瀏覽器 —— step-07 用 lint 擋
- ⚠️ `dbPath` 預設值在 build 時寫死為絕對路徑；部署時必須以 `NUXT_DB_PATH` 指定
- ⚠️ SQLite 適合教學與小型系統；多台機器部署時換成 PostgreSQL 等，只需改 `@mono/db` 內部
- ⚠️ 規則在 TS 中過濾代表會先撈全部資料；資料量大時需要在 repo 提供對應查詢，並以測試確保與 core 規則一致

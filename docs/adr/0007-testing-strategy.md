# 0007 測試策略：在套件層級測試規則與資料存取，並只測受影響的套件

- 狀態：已接受
- 引入於：step-08

## 背景
monorepo 中一個共用套件的修改會影響多個 app。若每次都測全部，CI 時間隨套件數成長；
若只靠手動驗證，跨套件的回歸（regression）很難發現。

## 決定
1. **測試放在最靠近規則的地方**
   | 套件 | 測什麼 | 方式 |
   |---|---|---|
   | `@mono/core` | 業務規則、格式化 | 純函式單元測試 |
   | `@mono/db` | repository 讀寫、0/1 ↔ boolean 轉換、db + core 整合 | `:memory:` SQLite，每個測試獨立 |
   | `apps/*` | （未來）頁面與 API | `@nuxt/test-utils`、Playwright |
2. **用 `--affected` 只跑受影響的任務**：turbo 依據 git diff 與依賴圖決定範圍。
3. `test` 任務使用 `dependsOn: ["transit"]`：依賴的原始碼改變時快取正確失效（同 ADR 0004）。

## 實測：`turbo run lint typecheck test build --affected`
| 修改的位置 | 被選到的任務 |
|---|---|
| `packages/db` | db#test、db#typecheck、web/admin 的 build、lint、typecheck（**core 不受影響**） |
| `apps/admin` | 只有 admin#build、lint、typecheck |
| `packages/ui` | ui#lint、typecheck，web/admin 的 build、lint、typecheck |
| 無變更 | 無 |

## 後果
- ✅ 共用套件的規則被測試鎖住（例如 formatPrice 的輸出格式不會再分歧）
- ✅ CI 時間與「變更的影響範圍」成正比，而非與 repo 大小成正比
- ⚠️ `--affected` 依賴 git 歷史：CI 需 `fetch-depth: 0` 或足夠的深度才能比較基準分支
- ⚠️ 依賴圖之外的影響（例如兩個 app 共用同一個 DB 檔的 schema）turbo 無法得知，需靠 db 套件的測試把關

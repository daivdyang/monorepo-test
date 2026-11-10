# 0002 抽出 @mono/core，採 Just-in-Time 內部套件

- 狀態：已接受
- 引入於：step-03

## 背景
`Product` 型別在前後台各寫一份；`formatPrice` 已分歧成兩種輸出格式；
「前台只顯示已上架商品」的規則寫死在前台 API handler 裡，後台儀表板又自己算一次。

## 決策一：什麼東西放進 core？
判斷標準：**被兩個以上 app 使用** 且 **與框架無關**（不 import Vue / Nuxt / Node API）。

| 放進 core | 不放進 core | 理由 |
|---|---|---|
| `Product` 型別、`ApiResponse<T>` | — | 前後台 API 契約 |
| `isOnStorefront`、`isSoldOut` | — | 業務規則必須單一來源 |
| `formatPrice` | — | 顯示一致性 |
| — | `AdminUser`、`Role` | 只有後台使用，留在 `apps/admin/shared/` |
| — | 假資料 | 屬於「資料存取」，另行設計（step-06） |

> 反模式提醒：不要預先把「可能會共用」的東西搬進 core，否則它會變成什麼都往裡丟的雜物抽屜。
> 等第二個使用者真正出現再搬（Rule of Three 的寬鬆版）。

## 決策二：內部套件如何交付？
| 策略 | 做法 | 優點 | 缺點 |
|---|---|---|---|
| **Just-in-Time** | `exports` 指向 `.ts` 原始碼，由使用端轉譯 | 零 build、改完即 HMR、設定最少 | 使用端必須能編譯 TS；無法被 turbo 快取 build 結果 |
| Compiled | 用 tsup/unbuild 輸出 `dist/` | 可快取、使用端不需處理 TS | 多一個 build/watch 步驟 |
| Publishable | Compiled + 發佈到 npm、語意化版本 | 可給 repo 外部使用 | 版本管理、changesets、發佈流程成本 |

採用 **Just-in-Time**：所有消費者都是 Nuxt（Vite + Nitro），本來就能處理 TS。

## 後果
- ✅ 改 `Product` 型別，前後台 typecheck 會**同時**報錯（已驗證）—— monorepo 的核心價值：原子性變更
- ✅ 業務規則單一來源
- ⚠️ core 必須保持框架無關，否則無法在瀏覽器、Nitro、測試中通用
- ⚠️ 若未來要給非 Vite 環境（如獨立 Node 腳本、其他 repo）使用，需改為 Compiled

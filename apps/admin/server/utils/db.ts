import { createProductRepo, getDb } from '@mono/db'

// Nitro 自動 import：server/ 內任何檔案都可直接呼叫 useProductRepo()
export function useProductRepo() {
  return createProductRepo(getDb(useRuntimeConfig().dbPath))
}

import { storefrontProducts, type ApiResponse, type Product } from '@mono/core'

// 資料來自 @mono/db（共享），規則來自 @mono/core（共享）
export default defineEventHandler((): ApiResponse<Product[]> => {
  const data = storefrontProducts(useProductRepo().list())
  return { data, total: data.length }
})

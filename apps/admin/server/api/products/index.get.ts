import type { ApiResponse, Product } from '@mono/core'

// 後台看得到全部商品（含未上架），但必須登入
export default defineEventHandler((event): ApiResponse<Product[]> => {
  requireAdmin(event)
  const data = useProductRepo().list()
  return { data, total: data.length }
})

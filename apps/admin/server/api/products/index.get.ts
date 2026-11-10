import type { ApiResponse, Product } from '#shared/types/product'
import { products } from '../../data/products'

// 後台看得到全部商品（含未上架），但必須登入
export default defineEventHandler((event): ApiResponse<Product[]> => {
  requireAdmin(event)
  return { data: products, total: products.length }
})

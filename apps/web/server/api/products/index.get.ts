import type { ApiResponse, Product } from '#shared/types/product'
import { products } from '../../data/products'

// 業務規則「前台只顯示已上架商品」寫死在這裡
export default defineEventHandler((): ApiResponse<Product[]> => {
  const data = products.filter(p => p.published)
  return { data, total: data.length }
})

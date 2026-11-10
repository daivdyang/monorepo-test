import { storefrontProducts, type ApiResponse, type Product } from '@mono/core'
import { products } from '../../data/products'

// 「前台顯示哪些商品」的規則來自 @mono/core，不再寫死在 handler
export default defineEventHandler((): ApiResponse<Product[]> => {
  const data = storefrontProducts(products)
  return { data, total: data.length }
})

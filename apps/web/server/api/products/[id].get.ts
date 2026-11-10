import { isOnStorefront } from '@mono/core'
import { products } from '../../data/products'

export default defineEventHandler((event) => {
  const id = Number(getRouterParam(event, 'id'))
  const product = products.find(p => p.id === id)
  if (!product || !isOnStorefront(product)) {
    throw createError({ statusCode: 404, statusMessage: 'Product not found' })
  }
  return product
})

import type { Product } from '@mono/core'
import { products } from '../../data/products'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const id = Number(getRouterParam(event, 'id'))
  const product = products.find(p => p.id === id)
  if (!product) {
    throw createError({ statusCode: 404, statusMessage: 'Product not found' })
  }

  const body = await readBody<Partial<Pick<Product, 'published' | 'stock' | 'price'>>>(event)
  if (typeof body.published === 'boolean') product.published = body.published
  if (typeof body.stock === 'number') product.stock = body.stock
  if (typeof body.price === 'number') product.price = body.price

  return product
})

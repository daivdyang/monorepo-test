import { isOnStorefront } from '@mono/core'

export default defineEventHandler((event) => {
  const id = Number(getRouterParam(event, 'id'))
  const product = useProductRepo().findById(id)
  if (!product || !isOnStorefront(product)) {
    throw createError({ statusCode: 404, statusMessage: 'Product not found' })
  }
  return product
})

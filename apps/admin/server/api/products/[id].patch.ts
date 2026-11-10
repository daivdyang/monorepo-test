import type { ProductPatch } from '@mono/db'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody<Record<string, unknown>>(event)

  // 只接受白名單欄位，且型別正確
  const patch: ProductPatch = {}
  if (typeof body.published === 'boolean') patch.published = body.published
  if (typeof body.stock === 'number') patch.stock = body.stock
  if (typeof body.price === 'number') patch.price = body.price

  const product = useProductRepo().update(id, patch)
  if (!product) {
    throw createError({ statusCode: 404, statusMessage: 'Product not found' })
  }
  return product
})

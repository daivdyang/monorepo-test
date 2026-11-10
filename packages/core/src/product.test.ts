import { describe, expect, it } from 'vitest'
import { isOnStorefront, isSoldOut, storefrontProducts, type Product } from './product'

const make = (over: Partial<Product> = {}): Product => ({
  id: 1, name: 'x', price: 100, stock: 1, published: true, ...over,
})

describe('業務規則', () => {
  it('只有已上架商品會出現在前台', () => {
    expect(isOnStorefront(make({ published: true }))).toBe(true)
    expect(isOnStorefront(make({ published: false }))).toBe(false)
  })

  it('售完的已上架商品仍顯示在前台（只是不能購買）', () => {
    const list = [make({ id: 1, stock: 0 }), make({ id: 2, published: false })]
    expect(storefrontProducts(list).map(p => p.id)).toEqual([1])
  })

  it('庫存 <= 0 視為售完', () => {
    expect(isSoldOut(make({ stock: 0 }))).toBe(true)
    expect(isSoldOut(make({ stock: -1 }))).toBe(true)
    expect(isSoldOut(make({ stock: 1 }))).toBe(false)
  })
})

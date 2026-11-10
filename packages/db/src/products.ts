import type { Product } from '@mono/core'
import type { Db } from './client'

interface ProductRow {
  id: number
  name: string
  price: number
  stock: number
  published: number
}

const toProduct = (r: ProductRow): Product => ({ ...r, published: r.published === 1 })

export type ProductPatch = Partial<Pick<Product, 'name' | 'price' | 'stock' | 'published'>>

/**
 * Repository：只負責「存取」，不負責「規則」。
 * 「前台顯示哪些商品」仍由 @mono/core 的 storefrontProducts() 決定，
 * 避免同一條業務規則同時存在於 SQL 與 TypeScript 兩處。
 */
export function createProductRepo(db: Db) {
  return {
    list(): Product[] {
      const rows = db.prepare('SELECT * FROM products ORDER BY id').all() as unknown as ProductRow[]
      return rows.map(toProduct)
    },

    findById(id: number): Product | undefined {
      const row = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as unknown as ProductRow | undefined
      return row && toProduct(row)
    },

    update(id: number, patch: ProductPatch): Product | undefined {
      const current = this.findById(id)
      if (!current) return undefined
      const next = { ...current, ...patch }
      db.prepare('UPDATE products SET name = ?, price = ?, stock = ?, published = ? WHERE id = ?')
        .run(next.name, next.price, next.stock, next.published ? 1 : 0, id)
      return next
    },
  }
}

export type ProductRepo = ReturnType<typeof createProductRepo>

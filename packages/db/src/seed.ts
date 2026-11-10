import type { DatabaseSync } from 'node:sqlite'
import type { Product } from '@mono/core'

// 取代 step-01 ~ step-05 前後台各自一份的假資料
export const seedProducts: Product[] = [
  { id: 1, name: '機械鍵盤', price: 3290, stock: 12, published: true },
  { id: 2, name: '無線滑鼠', price: 1290, stock: 0, published: true },
  { id: 3, name: '27 吋螢幕', price: 8990, stock: 5, published: true },
  { id: 4, name: '筆電支架', price: 990, stock: 30, published: false },
]

export function seedIfEmpty(db: DatabaseSync): void {
  const row = db.prepare('SELECT COUNT(*) AS n FROM products').get() as { n: number }
  if (row.n > 0) return
  const insert = db.prepare(
    'INSERT INTO products (id, name, price, stock, published) VALUES (?, ?, ?, ?, ?)',
  )
  for (const p of seedProducts) {
    insert.run(p.id, p.name, p.price, p.stock, p.published ? 1 : 0)
  }
}

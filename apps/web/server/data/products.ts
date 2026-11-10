import type { Product } from '@mono/core'

// 每個 app 各自一份 in-memory 假資料：兩個行程的資料彼此看不到
export const products: Product[] = [
  { id: 1, name: '機械鍵盤', price: 3290, stock: 12, published: true },
  { id: 2, name: '無線滑鼠', price: 1290, stock: 0, published: true },
  { id: 3, name: '27 吋螢幕', price: 8990, stock: 5, published: true },
  { id: 4, name: '筆電支架（未上架）', price: 990, stock: 30, published: false },
]

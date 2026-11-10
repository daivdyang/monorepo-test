// 領域模型（Domain）：前後台對「商品」的共同理解
export interface Product {
  id: number
  name: string
  price: number
  stock: number
  published: boolean
}

export interface ApiResponse<T> {
  data: T
  total?: number
}

// 業務規則集中在這裡，而不是散落在各 app 的 API handler 裡。
// 規則改變（例如「庫存為 0 也不顯示」）只需改一處，前後台同時生效。
export function isOnStorefront(p: Product): boolean {
  return p.published
}

export function isSoldOut(p: Product): boolean {
  return p.stock <= 0
}

export function storefrontProducts(list: readonly Product[]): Product[] {
  return list.filter(isOnStorefront)
}

// Nuxt 4 的 shared/ 目錄：同一個 app 內 app/ 與 server/ 共用的程式碼。
// 注意：它只能在「這個 app 內」共用，跨 app 就無能為力了。
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

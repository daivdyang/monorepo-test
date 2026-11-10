// 後台工程師自己寫了一版，輸出格式跟前台不同（NT$ 3,290 vs $3,290）
export function formatPrice(value: number): string {
  return `NT$ ${value.toLocaleString()}`
}

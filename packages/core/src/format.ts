// 統一的價格格式（取代 step-01 前後台各自分歧的兩個版本）
export function formatPrice(value: number, currency = 'TWD'): string {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

import { expect, it } from 'vitest'
import { formatPrice } from './format'

// 這個測試鎖住 step-01 時前後台分歧的格式：統一為 Intl 的 TWD 格式
it('formatPrice 輸出一致的新台幣格式', () => {
  expect(formatPrice(3290)).toBe('$3,290')
  expect(formatPrice(0)).toBe('$0')
})

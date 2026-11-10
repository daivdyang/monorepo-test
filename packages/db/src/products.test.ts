import { storefrontProducts } from '@mono/core'
import { beforeEach, describe, expect, it } from 'vitest'
import { createDb } from './client'
import { createProductRepo, type ProductRepo } from './products'
import { seedProducts } from './seed'

describe('ProductRepo', () => {
  let repo: ProductRepo

  beforeEach(() => {
    // 每個測試一個全新的記憶體資料庫，互不影響
    repo = createProductRepo(createDb(':memory:'))
  })

  it('初始化時寫入 seed 資料', () => {
    expect(repo.list()).toEqual(seedProducts)
  })

  it('published 在 DB 是 0/1，讀出時轉回 boolean', () => {
    expect(typeof repo.findById(1)?.published).toBe('boolean')
  })

  it('update 只修改指定欄位', () => {
    const updated = repo.update(1, { published: false })
    expect(updated).toMatchObject({ id: 1, name: '機械鍵盤', published: false })
    expect(repo.findById(1)?.published).toBe(false)
  })

  it('更新不存在的商品回傳 undefined', () => {
    expect(repo.update(999, { stock: 1 })).toBeUndefined()
  })

  // 跨套件整合：db 的資料 + core 的規則 = 前台看到的結果
  it('後台下架後，前台清單隨之減少', () => {
    const before = storefrontProducts(repo.list()).length
    repo.update(1, { published: false })
    expect(storefrontProducts(repo.list())).toHaveLength(before - 1)
  })
})

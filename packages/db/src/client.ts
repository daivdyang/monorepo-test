// ⚠️ server-only：這個套件使用 node:sqlite，只能在 Nitro（server/）中 import，
// 絕不可出現在 app/（瀏覽器）程式碼中。step-07 會用 lint 強制這條邊界。
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { migrate } from './schema'
import { seedIfEmpty } from './seed'

export type Db = DatabaseSync

/** 建立新連線並完成 migrate + seed（測試用 ':memory:'） */
export function createDb(path: string): Db {
  if (path !== ':memory:') {
    mkdirSync(dirname(path), { recursive: true })
  }
  const db = new DatabaseSync(path)
  // WAL + busy_timeout：前台與後台是兩個行程同時開同一個檔案
  db.exec('PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 3000;')
  migrate(db)
  seedIfEmpty(db)
  return db
}

const connections = new Map<string, Db>()

/** 同一個行程內共用連線（每個 Nitro 行程各自一條） */
export function getDb(path: string): Db {
  let db = connections.get(path)
  if (!db) {
    db = createDb(path)
    connections.set(path, db)
  }
  return db
}

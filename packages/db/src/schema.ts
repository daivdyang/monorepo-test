import type { DatabaseSync } from 'node:sqlite'

export function migrate(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id        INTEGER PRIMARY KEY,
      name      TEXT    NOT NULL,
      price     INTEGER NOT NULL,
      stock     INTEGER NOT NULL DEFAULT 0,
      published INTEGER NOT NULL DEFAULT 0
    )
  `)
}

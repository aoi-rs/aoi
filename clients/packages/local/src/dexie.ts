import type { Dexie, PromiseExtended, Table } from 'dexie'

export function aliases(db: Dexie) {
  db.Table.prototype.set = function set<T, TKey, TInsertType>(
    this: Table<T, TKey, TInsertType>,
    item: TInsertType,
    key?: TKey,
  ): PromiseExtended<TKey> {
    return this.put(item, key)
  }

  db.Table.prototype.list = function all<T, TKey, TInsertType>(
    this: Table<T, TKey, TInsertType>,
  ): PromiseExtended<T[]> {
    return this.orderBy(':id').reverse().toArray()
  }
}

declare module 'dexie' {
  // biome-ignore lint/suspicious/noExplicitAny: TypeScript requires the same type arguments used by the library
  interface Table<T = any, TKey = any, TInsertType = T> {
    set(item: TInsertType, key?: TKey): PromiseExtended<TKey>
    list(): PromiseExtended<T[]>
  }
}

import { Dexie, type EntityTable } from 'dexie'
import { aliases } from '@/dexie'
import type { Meta } from '@/models'
import type { Transaction } from '@/transactions'

const DATABASE_NAME = 'database'

export class Database extends Dexie {
  _meta!: EntityTable<Meta, 'id'>
  _transactions!: EntityTable<Transaction, 'id'>

  users!: EntityTable<Record<string, unknown>, 'id'>
  sessions!: EntityTable<Record<string, unknown>, 'id'>
  personal_access_tokens!: EntityTable<Record<string, unknown>, 'id'>

  constructor() {
    super(DATABASE_NAME, { addons: [aliases] })

    this.version(1).stores({
      _meta: 'id',
      _transactions: '++id, [model_class+model_id]',

      users: 'id',
      sessions: 'id',
      personal_access_tokens: 'id',
    })
  }
}

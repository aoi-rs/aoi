import { Dexie, type EntityTable } from 'dexie'
import { aliases } from '@/dexie'
import type { Meta } from '@/models'
import type { Transaction } from '@/transactions'

export interface RawModel {
  [k: string]: unknown
}

const DATABASE_NAME = 'database'

export class Database extends Dexie {
  _meta!: EntityTable<Meta, 'id'>
  _transactions!: EntityTable<Transaction, 'id'>

  users!: EntityTable<RawModel, 'id'>
  sessions!: EntityTable<RawModel, 'id'>
  personal_access_tokens!: EntityTable<RawModel, 'id'>

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

import { Dexie, type EntityTable } from 'dexie'

export interface Meta {
  id: 'meta'
  last_revision: number
}

export interface User {
  id: 'user'
  name: string | null
  email: string
  created_at: string
  modified_at: string | null
}

const DATABASE_NAME = 'database'

export const db = new Dexie(DATABASE_NAME) as Dexie & {
  user: EntityTable<User, 'id'>
  _meta: EntityTable<Meta, 'id'>
}

db.version(1).stores({
  _meta: '&id',
  user: '&id',
})

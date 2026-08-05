import { Dexie, type EntityTable } from 'dexie'
import { makeAutoObservable } from 'mobx'
import type { schemas } from '@/generated/server'
import type { Store } from '@/utils/store'

export interface Meta {
  id: 'meta'
  last_revision: number
}

export type Transaction =
  | {
      action: 'del'
      id: number
      model_class: 'session'
      model_id: string
    }
  | {
      action: 'set'
      id: number
      model_class: 'user'
      model_id: string
      data: Record<
        string,
        {
          from: unknown
          to: unknown
        }
      >
    }

export interface ProfileFields {
  id: 'me'
  name: string | null
  email: string
  created_at: string
  modified_at: string | null
}

export class Profile {
  private state: ProfileFields
  private mutated = false

  name: string | null

  readonly email: string
  readonly created_at: string
  readonly modified_at: string | null

  constructor(data: ProfileFields) {
    this.state = data

    this.email = data.email
    this.name = data.name
    this.created_at = data.created_at
    this.modified_at = data.modified_at

    makeAutoObservable(this)
  }

  async flush() {
    if (!this.mutated) {
      return
    }

    const _transaction: Transaction = {
      id: 1,
      action: 'set',
      model_class: 'user',
      model_id: 'me',
      data: { name: { from: this.state.name, to: this.name } },
    }

    // TODO: send transaction to scheduler

    this.name = this.state.name
  }
}

export interface SessionFields {
  id: string
  user_agent: string
  name: string
  refreshed_at: string
  is_current_session: boolean
  created_at: string
  modified_at: string | null
}

export class Session {
  private store: Store

  readonly id: string
  readonly user_agent: string
  readonly name: string
  readonly refreshed_at: string
  readonly is_current_session: boolean
  readonly created_at: string
  readonly modified_at: string | null

  constructor(store: Store, data: SessionFields) {
    this.store = store

    this.id = data.id
    this.user_agent = data.user_agent
    this.name = data.name
    this.refreshed_at = data.refreshed_at
    this.is_current_session = data.is_current_session
    this.created_at = data.created_at
    this.modified_at = data.modified_at
  }

  delete() {
    this.store.sessions = this.store.sessions.filter((s) => s.id !== this.id)
  }
}

export interface PersonalAccessTokenFields {
  id: string
  permissions: schemas['Permission'][]
  name: string
  expires_at: string | null
  created_at: string
  modified_at: string | null
}

export class PersonalAccessToken {
  private store: Store

  readonly id: string
  readonly created_at: string
  readonly modified_at: string | null

  name: string
  permissions: string[]
  expires_at: string | null

  constructor(store: Store, data: PersonalAccessTokenFields) {
    this.store = store

    this.id = data.id
    this.created_at = data.created_at
    this.modified_at = data.modified_at

    this.name = data.name
    this.permissions = data.permissions
    this.expires_at = data.expires_at
  }

  delete() {
    this.store.sessions = this.store.sessions.filter((s) => s.id !== this.id)
  }

  commit() {}
}

const DATABASE_NAME = 'database'

export const db = new Dexie(DATABASE_NAME) as Dexie & {
  _meta: EntityTable<Meta, 'id'>
  _transactions: EntityTable<Transaction, 'id'>

  user: EntityTable<ProfileFields, 'id'>
  sessions: EntityTable<SessionFields, 'id'>
  personal_access_tokens: EntityTable<PersonalAccessTokenFields, 'id'>
}

db.version(1).stores({
  _meta: '&id',
  _transactions: '&id',

  user: '&id',
  sessions: '&id',
  personal_access_tokens: '&id',
})

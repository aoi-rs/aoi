import { action, makeObservable, observable } from 'mobx'
import { Database, type RawModel } from '@/database'
import { Model, ModelRuntime } from '@/model'
import { PersonalAccessToken, Profile, Session } from '@/models'
import { readNDJSON } from '@/stream'
import { TransactionScheduler } from '@/transactions'
import { route } from '@/utils'

interface MetadataDelta {
  _metadata: { last_revision: number }
}

interface ModelDelta {
  _model: 'user' | 'session' | 'personal_access_token'
  deleted?: boolean
  [k: string]: unknown
}

type Delta = MetadataDelta | ModelDelta

interface StoreParams {
  server: string
}

export class Store {
  private db: Database
  private server: string

  success: boolean | null = null
  user: Profile | null = null
  sessions: Session[] = []
  tokens: PersonalAccessToken[] = []

  constructor({ server }: StoreParams) {
    this.server = server
    this.db = new Database()

    makeObservable<this, 'succeed' | 'fail'>(this, {
      success: observable,
      user: observable,
      sessions: observable,
      tokens: observable,
      add: action,
      remove: action,
      succeed: action,
      fail: action,
    })

    void this.init()
  }

  private async init() {
    await this.refresh()
    await this.load()
  }

  private succeed(user: RawModel, sessions: RawModel[], tokens: RawModel[]) {
    this.success = true
    this.user = new Profile(user)
    this.sessions = sessions.map((s) => new Session(s))
    this.tokens = tokens.map((t) => new PersonalAccessToken(t))
  }

  private fail() {
    this.success = false
  }

  private async load() {
    const [transactions, user, sessions, tokens] = await Promise.all([
      this.db._transactions.list(),
      this.db.users.get('@me'),
      this.db.sessions.list(),
      this.db.personal_access_tokens.list(),
    ])

    if (!user) {
      throw new Error('[aoi.rs] user not found in local database')
    }

    const scheduler = new TransactionScheduler({
      db: this.db,
      server: this.server,
      transactions,
    })

    Model.runtime = new ModelRuntime(scheduler)

    for (const transaction of transactions) {
      if (transaction.model_class === 'user' && transaction.action === 'set') {
        for (const field in transaction.data) {
          user[field] = transaction.data[field].to
        }
      }
    }

    this.succeed(user, sessions, tokens)
  }

  private async refresh() {
    const metadata = await this.db._meta.get('meta')
    const revision = metadata?.last_revision

    const address = route(this.server, '/v1/state/')

    if (revision) {
      address.searchParams.set('from_revision', `${revision}`)
    }

    const response = await fetch(address, {
      method: 'GET',
      credentials: 'include',
    })

    if (!response.ok) {
      return this.fail()
    }

    for await (const delta of readNDJSON<Delta>(
      response.body as ReadableStream,
    )) {
      if ('_model' in delta) {
        switch (delta._model) {
          case 'user':
            await this.db.users.set({ ...delta, id: '@me' })
            continue

          case 'session':
            if (delta.deleted) {
              await this.db.sessions.delete(delta.id as string)
              continue
            }

            await this.db.sessions.set(delta)
            continue

          case 'personal_access_token':
            if (delta.deleted) {
              await this.db.personal_access_tokens.delete(delta.id as string)
              continue
            }

            await this.db.personal_access_tokens.set(delta)
            continue
        }
      }

      await this.db._meta.set({
        id: 'meta',
        last_revision: delta._metadata.last_revision,
      })
    }
  }

  add(model: Model) {
    const COLLECTIONS_BY_MODEL_CLASS: Record<string, Model[]> = {
      session: this.sessions,
      personal_access_token: this.tokens,
    }

    const mclass = model.mclass()
    const collection = COLLECTIONS_BY_MODEL_CLASS[mclass]

    collection.unshift(model)
  }

  remove(model: Model) {
    const COLLECTIONS_BY_MODEL_CLASS: Record<string, Model[]> = {
      session: this.sessions,
      personal_access_token: this.tokens,
    }

    const mclass = model.mclass()
    const collection = COLLECTIONS_BY_MODEL_CLASS[mclass]

    const index = collection.indexOf(model)

    if (index !== -1) {
      collection.splice(index, 1)
    }
  }

  discard() {
    return this.db.delete()
  }
}

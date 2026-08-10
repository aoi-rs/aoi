import { action, makeObservable, observable, runInAction } from 'mobx'
import { Database } from '@/database'
import type { Model } from '@/model'
import { PersonalAccessToken, Profile, Session } from '@/models'
import { readNDJSON } from '@/stream'
import { TransactionExecutor, TransactionService } from '@/transactions'

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
  serviceURL: string
}

export class Store {
  private serviceURL: string

  private db: Database

  private executor: TransactionExecutor
  transactions: TransactionService

  loading = true

  user: Profile | null = null
  sessions: Session[] = []
  tokens: PersonalAccessToken[] = []

  constructor({ serviceURL }: StoreParams) {
    this.serviceURL = serviceURL

    this.db = new Database()
    this.executor = new TransactionExecutor(serviceURL)
    this.transactions = new TransactionService(this.db, this.executor)

    makeObservable(this, {
      loading: observable,
      user: observable,
      sessions: observable,
      tokens: observable,
      initialize: action,
      reconcile: action,
      hydrate: action,
    })

    void this.initialize()
  }

  async initialize() {
    await this.reconcile()
    await this.hydrate()

    runInAction(() => {
      this.loading = false
    })
  }

  async clear() {
    await this.db.delete()
  }

  async hydrate() {
    const transactions = await this.transactions.list()

    const user = await this.db.users.get('@me')
    const sessions = await this.db.sessions.orderBy(':id').reverse().toArray()

    const tokens = await this.db.personal_access_tokens
      .orderBy(':id')
      .reverse()
      .toArray()

    for (const transaction of transactions) {
      if (transaction.model_class === 'user' && transaction.action === 'set') {
        for (const field in transaction.data) {
          user![field] = transaction.data[field].to
        }
      }
    }

    runInAction(() => {
      this.user = user ? new Profile(user, this.transactions) : null
      this.sessions = sessions.map((s) => new Session(s, this.transactions))
      this.tokens = tokens.map(
        (t) => new PersonalAccessToken(t, this.transactions),
      )
    })
  }

  async reconcile() {
    const metadata = await this.db._meta.get('meta')
    const revision = metadata?.last_revision

    const address = new URL('/v1/state/', this.serviceURL)

    if (revision) {
      address.searchParams.set('from_revision', `${revision}`)
    }

    const response = await fetch(address, {
      method: 'GET',
      credentials: 'include',
    })

    if (!response.ok) {
      runInAction(() => {
        this.loading = false
      })

      return
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
}

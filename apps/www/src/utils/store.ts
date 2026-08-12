import { makeAutoObservable, runInAction } from 'mobx'
import type { schemas } from '@/generated/server'
import { CONFIG } from '@/utils/config'
import { db, PersonalAccessToken, Profile, Session } from '@/utils/db'
import { readNDJSON } from '@/utils/stream'

type Delta =
  | { _metadata: { last_revision: number } }
  | (schemas['UserSchema'] & { _model: 'user' })
  | (schemas['SessionSchema'] & { _model: 'session' })
  | (schemas['PersonalAccessTokenSchema'] & { _model: 'personal_access_token' })

export class Store {
  loading = true

  user: Profile | null = null
  sessions: Session[] = []
  tokens: PersonalAccessToken[] = []

  constructor() {
    makeAutoObservable(this)
    void this.initialize()
  }

  async initialize() {
    try {
      await this.reconcile()
    } finally {
      await this.hydrate()

      runInAction(() => {
        this.loading = false
      })
    }
  }

  private async hydrate() {
    const user = await db.user.get('me')
    const sessions = await db.sessions.toArray()
    const tokens = await db.personal_access_tokens.orderBy(':id').reverse().toArray()

    runInAction(() => {
      this.user = user ? new Profile(user) : null
      this.sessions = sessions.map((s) => new Session(this, s))
      this.tokens = tokens.map((t) => new PersonalAccessToken(this, t))
    })
  }

  async reconcile() {
    const metadata = await db._meta.get('meta')
    const revision = metadata?.last_revision

    const address = new URL('/v1/state/', CONFIG.API_BASE_URL)

    if (revision) {
      address.searchParams.set('from_revision', `${revision}`)
    }

    const response = await fetch(address, {
      method: 'GET',
      credentials: 'include',
    })

    if (!response.ok) {
      runInAction(() => {
        this.user = null
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
            await db.user.put({ ...delta, id: 'me' })
            continue

          case 'session':
            await db.sessions.put(delta)
            continue

          case 'personal_access_token':
            await db.personal_access_tokens.put(delta)
            continue
        }
      }

      await db._meta.put({
        id: 'meta',
        last_revision: delta._metadata.last_revision,
      })
    }
  }
}

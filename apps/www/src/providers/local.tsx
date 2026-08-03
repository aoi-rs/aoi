import { createContext, type ReactNode, useEffect, useState } from 'react'
import type { schemas } from '@/generated/server'
import { service } from '@/utils/client'
import { db } from '@/utils/db'
import { readNDJSON } from '@/utils/stream'

type Delta =
  | { _metadata: { last_revision: number } }
  | (schemas['UserSchema'] & { _model: 'user' })

interface StateContextProps {
  syncing: boolean
}

function stub(): never {
  throw new Error('used state context without <StateProvider>')
}

export const StateContext = createContext<StateContextProps>(
  // @ts-expect-error because of stub
  stub,
)

export function StateProvider({ children }: { children: ReactNode }) {
  const [syncing, setSyncing] = useState(true)

  useEffect(() => {
    async function reconcile() {
      const metadata = await db._meta.get('meta')
      const revision = metadata?.last_revision

      const { response } = await service.GET('/v1/state/', {
        params: { query: { from_revision: revision } },
      })

      for await (const delta of readNDJSON<Delta>(response.body!)) {
        if ('_model' in delta) {
          await db.user.put({ ...delta, id: 'user' })
          continue
        }

        await db._meta.put({ last_revision: delta._metadata.last_revision })
      }

      setSyncing(false)
    }

    reconcile()
  }, [])

  return <StateContext value={{ syncing }}>{children}</StateContext>
}

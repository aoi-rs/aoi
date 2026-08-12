'use client'

import { Store } from '@aoi-rs/local'
import { observer } from 'mobx-react-lite'
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react'
import { CONFIG } from '@/utils/config'

const StoreContext = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<Store | null>(null)

  useEffect(() => {
    setStore(new Store({ server: CONFIG.API_BASE_URL }))
  }, [])

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}

export function useStore() {
  const store = useContext(StoreContext)

  if (!store) {
    throw new Error(
      'called useStore without a <StoreProvider> or before initialization',
    )
  }

  return store
}

export const Loader = observer(({ children }: { children: ReactNode }) => {
  const store = useContext(StoreContext)

  if (!store || store.success === null) {
    // TODO: add a loader screen
    return null
  }

  if (store.success === false) {
    // TODO: add a error screen
    return null
  }

  return children
})

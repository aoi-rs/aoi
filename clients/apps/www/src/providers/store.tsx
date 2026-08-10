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
    setStore(new Store({ serviceURL: CONFIG.API_BASE_URL }))
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

  if (!store || store.loading) {
    return null
  }

  return children
})

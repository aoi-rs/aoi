'use client'

import { observer } from 'mobx-react-lite'
import { createContext, type ReactNode, useContext, useRef } from 'react'
import { Store } from '@/utils/store'

function stub(): never {
  throw new Error('used StoreContext without <StoreProvider>')
}

const StoreContext = createContext<Store>(
  // @ts-expect-error because of stub
  stub,
)

export function StoreProvider({ children }: { children: ReactNode }) {
  const store = useRef<Store | null>(null)

  if (store.current === null) {
    store.current = new Store()
  }

  return (
    <StoreContext.Provider value={store.current}>
      {children}
    </StoreContext.Provider>
  )
}

export const useStore = () => useContext(StoreContext)

export const Loader = observer(({ children }: { children: ReactNode }) => {
  const { loading } = useStore()

  if (loading) {
    return null
  }

  return children
})

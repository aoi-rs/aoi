'use client'

import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useState,
} from 'react'
import type { schemas } from '@/generated/server'

interface PersonalAccessTokenContextProps {
  tokens: schemas['PersonalAccessTokenSchema'][]
  count: number
  generated: string | null
  setGenerated: Dispatch<SetStateAction<string | null>>
}

function stub(): never {
  throw new Error(
    'used PersonalAccessTokenContext without <PersonalAccessTokenContextProvider>',
  )
}

export const PersonalAccessTokenContext =
  createContext<PersonalAccessTokenContextProps>(
    // @ts-expect-error because of stub
    stub,
  )

interface PersonalAccessTokenContextProviderProps {
  tokens: schemas['PersonalAccessTokenSchema'][]
  count: number
  children: ReactNode
}

export function PersonalAccessTokenContextProvider({
  tokens,
  count,
  children,
}: PersonalAccessTokenContextProviderProps) {
  const [generated, setGenerated] = useState<string | null>(null)

  return (
    <PersonalAccessTokenContext
      value={{ tokens, count, generated, setGenerated }}
    >
      {children}
    </PersonalAccessTokenContext>
  )
}

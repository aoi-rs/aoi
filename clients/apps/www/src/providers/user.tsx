'use client'

import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useState,
} from 'react'
import type { schemas } from '@/generated/server'

interface UserContextProps {
  user: schemas['UserSchema'] | null
  setUser: Dispatch<SetStateAction<schemas['UserSchema']>>
}

function stub(): never {
  throw new Error('used user context without <UserProvider>')
}

export const UserContext = createContext<UserContextProps>(
  // @ts-expect-error because of stub
  stub,
)

export function UserProvider({
  user: _user,
  children,
}: {
  user: UserContextProps['user'] | null
  children: ReactNode
}) {
  const [user, setUser] = useState(_user)

  return (
    <UserContext.Provider
      value={{
        user,
        setUser: setUser as Dispatch<SetStateAction<schemas['UserSchema']>>,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

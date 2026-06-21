import type { ReactNode } from 'react'
import { unwrap } from '@/generated/server'
import { PersonalAccessTokenContextProvider } from '@/providers/personal-access-tokens'
import { createSSRClient } from '@/utils/client/serverside'

interface SettingsLayoutProps {
  children: ReactNode
}

export default async function SettingsLayout({
  children,
}: SettingsLayoutProps) {
  const service = await createSSRClient()

  const { items, pagination } = await unwrap(
    service.GET('/v1/personal_access_tokens/', {
      params: { query: { limit: 100 } },
    }),
  )

  return (
    <PersonalAccessTokenContextProvider
      tokens={items}
      count={pagination.total_count}
    >
      {children}
    </PersonalAccessTokenContextProvider>
  )
}

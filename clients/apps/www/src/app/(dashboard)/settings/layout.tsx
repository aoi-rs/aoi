import type { ReactNode } from 'react'
import { SidebarTrigger } from '@/components/ui/sidebar'
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
      <header className="sticky top-0 z-30 flex h-10.75 shrink-0 items-center gap-2 border-[oklch(0.2516_0.0036_270.88)] border-b bg-[oklch(0.1711_0.0011_271.29)] px-3.75 transition-[width,height] ease-linear lg:hidden">
        <div className="flex w-full items-center gap-2">
          <SidebarTrigger />
          <span className="font-semibold text-sm text-white">Preferences</span>
        </div>
      </header>

      {children}
    </PersonalAccessTokenContextProvider>
  )
}

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
      <header className="flex h-10.75 shrink-0 items-center gap-2 px-3.75 border-b border-[oklch(0.2516_0.0036_270.88)] transition-[width,height] ease-linear sticky top-0 bg-[oklch(0.1711_0.0011_271.29)] lg:hidden z-30">
        <div className="flex items-center gap-2 w-full">
          <SidebarTrigger />
          <span className="font-semibold text-sm text-white">Preferences</span>
        </div>
      </header>

      {children}
    </PersonalAccessTokenContextProvider>
  )
}

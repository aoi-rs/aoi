import { cookies } from 'next/headers'
import type { ReactNode } from 'react'
import { MainSidebar } from '@/components/main-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

interface DashboardLayoutProps {
  children: ReactNode
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const _cookies = await cookies()
  const collapsed = _cookies.get('sidebar_state')?.value === 'false'

  return (
    <SidebarProvider defaultOpen={!collapsed}>
      <MainSidebar variant="inset" />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  )
}

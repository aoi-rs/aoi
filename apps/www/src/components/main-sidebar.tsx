import type * as React from 'react'
import { MainMenu } from '@/components/main-menu'
import { Sidebar, SidebarContent, SidebarHeader } from '@/components/ui/sidebar'
import { UserMenu } from '@/components/user-menu'

export function MainSidebar(props: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <UserMenu />
      </SidebarHeader>
      <SidebarContent>
        <MainMenu />
      </SidebarContent>
    </Sidebar>
  )
}

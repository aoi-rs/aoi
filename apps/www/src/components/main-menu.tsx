'use client'

import { Layers, SlidersHorizontal } from 'lucide-react'
import { ActiveLink } from '@/components/active-link'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

const ITEMS = [
  {
    title: 'Links',
    icon: <Layers />,
    link: {
      href: '/links',
      matcher: /^\/(links|link)/,
    },
  },
  {
    title: 'Preferences',
    icon: <SlidersHorizontal />,
    link: {
      href: '/settings',
      matcher: /^\/settings/,
    },
  },
]

export function MainMenu() {
  return (
    <SidebarMenu>
      {ITEMS.map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton
            tooltip={item.title}
            render={
              <ActiveLink
                href={item.link.href}
                matcher={item.link.matcher}
                className="flex items-center rounded-lg border border-transparent cursor-default px-2.5 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground"
              />
            }
          >
            <span className="grid place-content-center overflow-visible rounded-full bg-transparent [&>svg]:size-3.5">
              {item.icon}
            </span>

            <span className="text-[0.8125rem] font-medium">{item.title}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )
}

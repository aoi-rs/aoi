'use client'

import { Globe, SlidersHorizontal } from 'lucide-react'
import Link from 'next/link'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

const ITEMS = [
  {
    title: 'Links',
    link: '/links',
    icon: <Globe />,
  },
  {
    title: 'Preferences',
    link: '/settings',
    icon: <SlidersHorizontal />,
  },
]

export function MainMenu() {
  const { state } = useSidebar()

  return (
    <SidebarMenu>
      {ITEMS.map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton
            tooltip={item.title}
            render={
              <Link
                href={item.link}
                className={cn(
                  'flex items-center rounded-lg border border-transparent cursor-default px-2.5 transition-colors text-aoi-500 hover:text-aoi-200',
                  state === 'collapsed' && '!dark:text-aoi-600',
                )}
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

'use client'

import { ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useContext } from 'react'
import { toast } from 'sonner'
import { Avatar, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { UserContext } from '@/providers/user'
import { service } from '@/utils/client'

export function UserMenu() {
  const { user } = useContext(UserContext)
  const router = useRouter()

  async function handleLogOut() {
    const { error } = await service.DELETE('/v1/auth/logout')

    if (error) {
      toast.error('Something went wrong while logging out')
      return
    }

    router.push('/login')
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton className="w-fit rounded-full px-2 data-pressed:bg-sidebar-accent" />
            }
          >
            <Avatar className="size-5">
              <AvatarImage src="/preview-avatar.png" alt={user?.email} />
            </Avatar>
            <span className="truncate font-medium text-sm text-white leading-tight">
              {user?.name ?? 'You'}
            </span>
            <ChevronDown className="size-3! text-sidebar-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <DropdownMenuItem render={<Link href="/settings" />}>
                Preferences
                <div className="ml-auto space-x-1">
                  <DropdownMenuShortcut>G</DropdownMenuShortcut>
                  <DropdownMenuShortcut>then</DropdownMenuShortcut>
                  <DropdownMenuShortcut>S</DropdownMenuShortcut>
                </div>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogOut}>Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

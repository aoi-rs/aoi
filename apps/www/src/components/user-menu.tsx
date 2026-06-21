'use client'

import {
  BellIcon,
  ChevronDown,
  CircleUserRoundIcon,
  CreditCardIcon,
  LogOutIcon,
} from 'lucide-react'
import { useContext } from 'react'
import { Avatar, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { UserContext } from '@/providers/user'

export function UserMenu() {
  const { user } = useContext(UserContext)

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="sm"
                className="w-fit rounded-full px-2"
              />
            }
          >
            <Avatar className="size-5">
              <AvatarImage src="/preview-avatar.png" alt={user?.email} />
            </Avatar>
            <span className="truncate font-medium text-sm leading-tight">
              {user?.name ?? 'You'}
            </span>
            <ChevronDown className="size-3! text-asahi-500" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="min-w-56" align="end" sideOffset={4}>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <CircleUserRoundIcon />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCardIcon />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <BellIcon />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogOutIcon />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

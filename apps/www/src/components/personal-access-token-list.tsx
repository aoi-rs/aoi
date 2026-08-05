'use client'

import { formatDistanceToNow } from 'date-fns'
import { Ellipsis, Key, SlidersVertical, X } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import {
  ListView,
  ListViewBadge,
  ListViewClickable,
  ListViewContent,
  ListViewDescription,
  ListViewDetails,
  ListViewHeader,
  ListViewItem,
  ListViewTitle,
} from '@/app/(dashboard)/settings/_components/list-view'
import { RevokePersonalAccessTokenDialog } from '@/components/revoke-personal-access-token-dialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { observer } from 'mobx-react-lite'
import { useStore } from '@/providers/store'

export const PersonalAccessTokenList = observer(() => {
  const [willRevoke, setWillRevoke] = useState<string | null>(null)

  const { tokens } = useStore()

  return (
    <ListView>
        <ListViewHeader>
          <span>
            {tokens.length > 0
              ? tokens.length +
                ' PAT' +
                (tokens.length > 1 ? 's' : '')
              : "You don't have tokens registered"}
          </span>

          <Button
            variant="ghost"
            size="sm"
            render={<Link href="/settings/tokens/create" />}
            nativeButton={false}
          >
            Create token
          </Button>
        </ListViewHeader>

      {tokens.length >= 1 && (
        <ListViewContent>
          {tokens.map((token) => (
            <ListViewItem key={token.id}>
              <ListViewClickable
                render={<Link href={'/settings/tokens/' + token.id} />}
              />

              <ListViewBadge>
                <Key />
              </ListViewBadge>

              <ListViewDetails>
                <ListViewTitle>{token.name}</ListViewTitle>

                <ListViewDescription>
                  Created{' '}
                  {formatDistanceToNow(token.created_at, {
                    addSuffix: true,
                  })}{' '}
                  ·{' '}
                  {token.created_at
                    ? 'Last used ' +
                      formatDistanceToNow(token.created_at, { addSuffix: true })
                    : 'never used'}
                </ListViewDescription>
              </ListViewDetails>

              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      className="z-10 size-8 [&_svg]:size-4!"
                      data-slot="button"
                      size="icon"
                      variant="ghost"
                    >
                      <Ellipsis />
                    </Button>
                  }
                />

                <DropdownMenuContent>
                  <DropdownMenuItem
                    render={
                      <Link href={'/settings/tokens/' + token.id + '/edit'} />
                    }
                  >
                    <SlidersVertical />
                    Edit token
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={() => setWillRevoke(token.id)}>
                    <X />
                    Revoke token
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </ListViewItem>
          ))}
        </ListViewContent>
      )}

      <RevokePersonalAccessTokenDialog
        id={willRevoke as string}
        open={!!willRevoke}
        onOpenChange={(open) => {
          if (!open) {
            setWillRevoke(null)
          }
        }}
      />
    </ListView>
  )
})

'use client'

import { useQuery } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { Ellipsis, Key, SlidersVertical, X } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import {
  ListView,
  ListViewClickable,
  ListViewDescription,
  ListViewDetails,
  ListViewFigure,
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
import { unwrap } from '@/generated/server'
import { service } from '@/utils/client'
import { defaultRetry } from '@/utils/retry'

export function PersonalAccessTokenList() {
  const [revoking, setRevoking] = useState<string | null>(null)

  const tokens = useQuery({
    queryKey: ['personal_access_tokens'],
    queryFn: () =>
      unwrap(
        service.GET('/v1/personal_access_tokens/', {
          params: { query: { limit: 100 } },
        }),
      ),
    retry: defaultRetry,
  })

  return (
    <ListView>
      {tokens.data && (
        <ListViewHeader>
          <span>
            {tokens.data.pagination.total_count > 0
              ? tokens.data.pagination.total_count +
                ' PAT' +
                (tokens.data.pagination.total_count > 1 ? 's' : '')
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
      )}

      {tokens.data && (
        <ListView>
          {tokens.data.items.map((token) => (
            <ListViewItem key={token.id}>
              <ListViewClickable
                render={<Link href={'/settings/tokens/' + token.id} />}
              />

              <ListViewFigure>
                <Key />
              </ListViewFigure>

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

                  <DropdownMenuItem onClick={() => setRevoking(token.id)}>
                    <X />
                    Revoke token
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </ListViewItem>
          ))}
        </ListView>
      )}

      <RevokePersonalAccessTokenDialog
        id={revoking as string}
        open={!!revoking}
        onOpenChange={(open) => {
          if (!open) {
            setRevoking(null)
          }
        }}
      />
    </ListView>
  )
}

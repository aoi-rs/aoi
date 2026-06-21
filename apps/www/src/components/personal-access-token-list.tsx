'use client'

import { useQuery } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { Ellipsis, Key, SlidersVertical, X } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { RevokePersonalAccessTokenDialog } from '@/components/revoke-personal-access-token-dialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { unwrap } from '@/generated/server'
import { cn } from '@/lib/utils'
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
    <div className="rounded-2xl bg-asahi-800 border border-asahi-700">
      {tokens.data && (
        <header
          className={cn(
            'p-4 flex items-center justify-between',
            tokens.data.pagination.total_count > 0 &&
              'border-b border-asahi-700',
          )}
        >
          <span
            className={cn(
              'text-white text-sm font-medium',
              tokens.data.pagination.total_count === 0 &&
                'text-asahi-500 font-[450]',
            )}
          >
            {tokens.data.pagination.total_count > 0
              ? tokens.data.pagination.total_count +
                ' Personal access token' +
                (tokens.data.pagination.total_count > 1 ? 's' : '')
              : "You don't have tokens registered"}
          </span>

          <Button
            variant="ghost"
            size="sm"
            className="rounded-full"
            render={<Link href="/settings/tokens/create">Create token</Link>}
            nativeButton={false}
          />
        </header>
      )}

      {tokens.data && (
        <ul className="flex flex-col divide-asahi-700 divide-y">
          {tokens.data.items.map((token) => (
            <li
              key={token.id}
              className="p-4 relative hover:bg-asahi-700 flex gap-4 items-center group/item last:rounded-b-2xl"
            >
              <Link
                className="inset-0 absolute block cursor-default group-last/item:rounded-b-2xl"
                href={'/settings/tokens/' + token.id}
              />

              <figure className="size-8 bg-asahi-700 grid place-content-center rounded-sm">
                <Key className="size-4 text-asahi-500" />
              </figure>

              <div className="flex flex-col flex-1 gap-0.5">
                <span className="text-sm leading-4 font-medium flex items-center gap-2">
                  {token.name}
                </span>
                <span className="text-asahi-500 text-sm leading-4 font-[450]">
                  Created{' '}
                  {formatDistanceToNow(token.created_at, {
                    addSuffix: true,
                  })}{' '}
                  ·{' '}
                  {token.created_at
                    ? 'Last used ' +
                      formatDistanceToNow(token.created_at, { addSuffix: true })
                    : 'never used'}
                </span>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      className="z-10 size-8 [&_svg]:size-4!"
                      size="icon"
                      variant="ghost"
                      data-slot="dropdown-menu-trigger"
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
            </li>
          ))}
        </ul>
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
    </div>
  )
}

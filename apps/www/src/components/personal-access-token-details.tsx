'use client'

import { format } from 'date-fns'
import { Ellipsis, SlidersVertical, X } from 'lucide-react'
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
import type { schemas } from '@/generated/server'

interface PersonalAccessTokenDetailsProps {
  token: schemas['PersonalAccessTokenSchema']
}

const LIST_FORMATTER = new Intl.ListFormat('en', { style: 'long' })

export function PersonalAccessTokenDetails({
  token,
}: PersonalAccessTokenDetailsProps) {
  const permissions = parsePermissions(token.permissions)

  const [revoking, setRevoking] = useState(false)

  return (
    <div className="flex flex-col mt-4 mb-8 mx-5.5 sm:mx-10 sm:my-16 items-center">
      <div className="w-full max-w-160 flex flex-col gap-8">
        <div className="flex flex-col gap-1 px-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-medium flex-1">{token.name}</h1>

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
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

                <DropdownMenuItem onClick={() => setRevoking(true)}>
                  <X />
                  Revoke token
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <p className="text-sm font-[450] text-aoi-500">
            Created {format(token.created_at, 'MMM d y')}
          </p>
        </div>

        <div className="rounded-2xl bg-aoi-850 border border-aoi-700 bg-aoi-800">
          <ul className="flex flex-col divide-aoi-700 divide-y">
            <li className="p-4 flex items-center gap-3">
              <div className="flex flex-col">
                <span className="text-sm font-medium">PAT name</span>

                <span className="text-xs font-[450] text-aoi-500">
                  {token.name}
                </span>
              </div>
            </li>

            <li className="p-4 flex items-center gap-3">
              <div className="flex flex-col">
                <span className="text-sm font-medium">Lifetime</span>

                <span className="text-xs font-[450] text-aoi-500">
                  {token.expires_at
                    ? 'Ends on ' + format(token.expires_at, 'MMM d y')
                    : 'Unlimited'}
                </span>
              </div>
            </li>

            <li className="p-4 flex items-center gap-3">
              <div className="flex flex-col gap-0.75">
                <div className="text-sm font-medium">Permissions</div>

                {permissions.read.length > 0 && (
                  <div className="text-xs py-1">
                    <span className="font-medium text-white">Read</span>
                    <span className="font-[450] text-aoi-500">
                      {' '}
                      access to {LIST_FORMATTER.format(permissions.read)}
                    </span>
                  </div>
                )}

                {permissions.write.length > 0 && (
                  <div className="text-xs py-1">
                    <span className="font-medium text-white">Read & write</span>
                    <span className="font-[450] text-aoi-500">
                      {' '}
                      access to {LIST_FORMATTER.format(permissions.write)}
                    </span>
                  </div>
                )}
              </div>
            </li>
          </ul>
        </div>
      </div>

      <RevokePersonalAccessTokenDialog
        id={token.id}
        open={revoking}
        onOpenChange={setRevoking}
      />
    </div>
  )
}

const PERMISSION_RESOURCE_LABELS: Record<string, string> = {
  user: 'profile',
  sessions: 'sessions',
  personal_access_tokens: 'PATs',
  links: 'links',
}

const MAX_PERMISSIONS = 8

function parsePermissions(permissions: schemas['Permission'][]) {
  if (permissions.length === 0) {
    return { read: [], write: [] }
  }

  if (permissions.length === MAX_PERMISSIONS) {
    return { read: [], write: ['profile', 'sessions', 'PATs', 'links'] }
  }

  const hash: Record<string, 'read' | 'write' | null> = {
    user: null,
    sessions: null,
    personal_access_tokens: null,
    links: null,
  }

  for (const permission of permissions) {
    const separator = permission.lastIndexOf('_')

    const resource = permission.slice(0, separator)
    const level = permission.slice(separator + 1)

    if (level === 'write' || hash[resource] !== 'write') {
      hash[resource] = level as 'read' | 'write'
    }
  }

  const lists = { read: [] as string[], write: [] as string[] }

  for (const [resource, level] of entries(hash)) {
    if (!level) {
      continue
    }

    const label = PERMISSION_RESOURCE_LABELS[resource]
    const list = lists[level]

    list.push(label)
  }

  return lists
}

function entries<K extends string | number | symbol, V>(
  dict: Record<K, V>,
): [K, V][] {
  return Object.entries(dict) as [K, V][]
}

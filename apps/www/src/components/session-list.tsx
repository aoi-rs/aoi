'use client'

import { useQuery } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { Globe } from 'lucide-react'
import { useState } from 'react'
import { LogoutDialog } from '@/components/logout-dialog'
import { RevokeOtherSessionsDialog } from '@/components/revoke-other-sessions-dialog'
import { RevokeSessionDialog } from '@/components/revoke-session-dialog'
import { Button } from '@/components/ui/button'
import type { schemas } from '@/generated/server'
import { unwrap } from '@/generated/server'
import { service } from '@/utils/client'
import { defaultRetry } from '@/utils/retry'

interface SessionListProps {
  sessions: {
    items: schemas['SessionSchema'][]
    pagination: schemas['Pagination']
  }
}

export function SessionList({ sessions: _sessions }: SessionListProps) {
  const [revokingOthers, setRevokingOthers] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [revoking, setRevoking] = useState<string | null>(null)

  const sessions = useQuery({
    queryKey: ['sessions'],
    queryFn: () =>
      unwrap(
        service.GET('/v1/sessions/', {
          params: { query: { limit: 100 } },
        }),
      ),
    retry: defaultRetry,
    initialData: _sessions,
  })

  if (!sessions.data) {
    return null
  }

  const { current, others } = detachCurrentSession(sessions.data.items)

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-2xl bg-asahi-800 border border-asahi-700">
        <ul className="flex flex-col divide-asahi-700 divide-y">
          <li className="p-4 relative hover:bg-asahi-700 flex gap-4 items-center group/item rounded-2xl">
            <div className="inset-0 absolute block cursor-default group-last/item:rounded-b-2xl" />

            <figure className="size-8 bg-asahi-700 grid place-content-center rounded-md">
              <Globe className="size-4 text-asahi-500" />
            </figure>

            <div className="flex flex-col flex-1 gap-0.5">
              <span className="text-sm leading-4 font-medium flex items-center gap-2">
                {current.name}
              </span>
              <span className="text-asahi-500 text-sm leading-4 font-[450]">
                Your current session
              </span>
            </div>

            <Button
              className="z-10 opacity-0 group-hover/item:opacity-100"
              size="sm"
              variant="ghost"
              data-slot="dropdown-menu-trigger"
              onClick={() => setLoggingOut(true)}
            >
              Log out
            </Button>
          </li>
        </ul>
      </div>

      {sessions.data.pagination.total_count > 1 && (
        <div className="rounded-2xl bg-asahi-800 border border-asahi-700">
          <header className="p-4 flex items-center justify-between border-b border-asahi-700">
            <span className="text-white text-sm font-medium">
              {sessions.data.pagination.total_count - 1} other session
              {sessions.data.pagination.total_count > 2 && 's'}
            </span>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRevokingOthers(true)}
            >
              Revoke all
            </Button>
          </header>

          <ul className="flex flex-col divide-asahi-700 divide-y">
            {others.map((session) => (
              <li
                key={session.id}
                className="p-4 relative flex gap-4 hover:bg-asahi-700 items-center group/item last:rounded-b-2xl"
              >
                <div className="inset-0 absolute block cursor-default group-last/item:rounded-b-2xl" />

                <figure className="size-8 bg-asahi-700 grid place-content-center rounded-md">
                  <Globe className="size-4 text-asahi-500" />
                </figure>

                <div className="flex flex-col flex-1 gap-0.5">
                  <span className="text-sm leading-4 font-medium flex items-center gap-2">
                    {session.name}
                  </span>
                  <span className="text-asahi-500 text-sm leading-4 font-[450]">
                    Last seen{' '}
                    {formatDistanceToNow(session.refreshed_at, {
                      addSuffix: true,
                    })}
                  </span>
                </div>

                <Button
                  className="z-10 opacity-0 group-hover/item:opacity-100"
                  size="sm"
                  variant="ghost"
                  data-slot="dropdown-menu-trigger"
                  onClick={() => setRevoking(session.id)}
                >
                  Revoke
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <LogoutDialog open={loggingOut} onOpenChange={setLoggingOut} />

      <RevokeOtherSessionsDialog
        open={revokingOthers}
        onOpenChange={setRevokingOthers}
      />

      <RevokeSessionDialog
        session={revoking as string}
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

function detachCurrentSession(sessions: schemas['SessionSchema'][]) {
  let current!: schemas['SessionSchema']
  const others: schemas['SessionSchema'][] = []

  for (const session of sessions) {
    if (session.is_current_session) {
      current = session
      continue
    }

    others.push(session)
  }

  return { current, others }
}

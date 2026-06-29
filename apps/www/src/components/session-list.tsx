'use client'

import { useQuery } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { Globe } from 'lucide-react'
import { useState } from 'react'
import {
  ListView,
  ListViewClickable,
  ListViewContent,
  ListViewDescription,
  ListViewDetails,
  ListViewFigure,
  ListViewHeader,
  ListViewItem,
  ListViewTitle,
} from '@/app/(dashboard)/settings/_components/list-view'
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
      <ListView>
        <ListViewContent>
          <ListViewItem>
            <ListViewClickable />

            <ListViewFigure>
              <Globe />
            </ListViewFigure>

            <ListViewDetails>
              <ListViewTitle>{current.name}</ListViewTitle>
              <ListViewDescription>Your current session</ListViewDescription>
            </ListViewDetails>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => setLoggingOut(true)}
            >
              Log out
            </Button>
          </ListViewItem>
        </ListViewContent>
      </ListView>

      {sessions.data.pagination.total_count > 1 && (
        <ListView>
          <ListViewHeader>
            <span>
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
          </ListViewHeader>

          <ListViewContent>
            {others.map((session) => (
              <ListViewItem
                key={session.id}
              >
                <ListViewClickable />

                <ListViewFigure>
                  <Globe  />
                </ListViewFigure>

                <ListViewDetails>
                  <ListViewTitle>
                    {session.name}
                  </ListViewTitle>

                  <ListViewDescription>
                    Last seen{' '}
                    {formatDistanceToNow(session.refreshed_at, {
                      addSuffix: true,
                    })}
                  </ListViewDescription>
                </ListViewDetails>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setRevoking(session.id)}
                >
                  Revoke
                </Button>
              </ListViewItem>
            ))}
          </ListViewContent>
        </ListView>
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

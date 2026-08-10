'use client'

import { Session } from '@aoi-rs/local'
import { formatDistanceToNow } from 'date-fns'
import { Globe } from 'lucide-react'
import { observer } from 'mobx-react-lite'
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
import { LogoutDialog } from '@/components/logout-dialog'
import { RevokeOtherSessionsDialog } from '@/components/revoke-other-sessions-dialog'
import { RevokeSessionDialog } from '@/components/revoke-session-dialog'
import { Button } from '@/components/ui/button'
import type { schemas } from '@/generated/server'
import { useStore } from '@/providers/store'

interface SessionListProps {
  sessions: {
    items: schemas['SessionSchema'][]
    pagination: schemas['Pagination']
  }
}

export const SessionList = observer(
  ({ sessions: _sessions }: SessionListProps) => {
    const [willRevoke, setWillRevoke] = useState<Session | '@others' | null>(
      null,
    )

    const { sessions } = useStore()
    const { current, others } = detachCurrentSession(sessions)

    return (
      <div className="flex flex-col gap-3">
        <ListView>
          <ListViewContent>
            <ListViewItem>
              <ListViewClickable />

              <ListViewBadge>
                <Globe />
              </ListViewBadge>

              <ListViewDetails>
                <ListViewTitle>{current.name}</ListViewTitle>
                <ListViewDescription>Your current session</ListViewDescription>
              </ListViewDetails>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => setWillRevoke(current)}
              >
                Log out
              </Button>
            </ListViewItem>
          </ListViewContent>
        </ListView>

        {sessions.length > 1 && (
          <ListView>
            <ListViewHeader>
              <span>
                {sessions.length - 1} other session
                {sessions.length > 2 && 's'}
              </span>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setWillRevoke('@others')}
              >
                Revoke all
              </Button>
            </ListViewHeader>

            <ListViewContent>
              {others.map((session) => (
                <ListViewItem key={session.id}>
                  <ListViewClickable />

                  <ListViewBadge>
                    <Globe />
                  </ListViewBadge>

                  <ListViewDetails>
                    <ListViewTitle>{session.name}</ListViewTitle>

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
                    onClick={() => setWillRevoke(session)}
                  >
                    Revoke
                  </Button>
                </ListViewItem>
              ))}
            </ListViewContent>
          </ListView>
        )}

        <LogoutDialog
          open={willRevoke instanceof Session && willRevoke.is_current_session}
          onOpenChange={() => setWillRevoke(null)}
        />

        <RevokeOtherSessionsDialog
          open={willRevoke === '@others'}
          onOpenChange={() => setWillRevoke(null)}
        />

        <RevokeSessionDialog
          session={willRevoke as Session}
          open={willRevoke instanceof Session && !willRevoke.is_current_session}
          onOpenChange={(o) => {
            if (!o) {
              setWillRevoke(null)
            }
          }}
        />
      </div>
    )
  },
)

function detachCurrentSession(sessions: Session[]) {
  let current!: Session
  const others: Session[] = []

  for (const session of sessions) {
    if (session.is_current_session) {
      current = session
      continue
    }

    others.push(session)
  }

  return { current, others }
}

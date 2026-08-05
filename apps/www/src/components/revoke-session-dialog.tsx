'use client'

import type { ComponentProps } from 'react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { service } from '@/utils/client'
import type { Session } from '@/utils/db'

interface RevokeSessionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  session: Session
}

export function RevokeSessionDialog({
  session,
  ...props
}: RevokeSessionDialogProps) {
  async function handleRevokeSession() {
    session.delete()
    toast.success('The session has been revoked')

    props.onOpenChange(false)

    const { error } = await service.DELETE('/v1/sessions/{id}', {
      params: { path: { id: session.id } },
    })

    if (error) {
      toast.error('Something went wrong while revoking the session')
      return
    }
  }

  return (
    <AlertDialog {...props}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hold on!</AlertDialogTitle>

          <AlertDialogDescription>
            You're about to revoke access for this session. The device using it
            will be logged out.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>

          <AlertDialogAction onClick={handleRevokeSession}>
            Revoke
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

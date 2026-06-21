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
import { getQueryClient } from '@/utils/query'

interface RevokeSessionDialogProps extends ComponentProps<typeof AlertDialog> {
  session: string
}

export function RevokeSessionDialog({
  session,
  ...props
}: RevokeSessionDialogProps) {
  async function handleRevokeSession() {
    const { error } = await service.DELETE('/v1/sessions/{id}', {
      params: { path: { id: session } },
    })

    if (error) {
      toast.error('Something went wrong while revoking the session')
      return
    }

    toast.success('The session has been revoked')
    getQueryClient().invalidateQueries({ queryKey: ['sessions'] })
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

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

interface RevokeOtherSessionsDialogProps
  extends ComponentProps<typeof AlertDialog> {}

export function RevokeOtherSessionsDialog({
  ...props
}: RevokeOtherSessionsDialogProps) {
  async function handleRevokeOtherSessions() {
    const { error } = await service.DELETE('/v1/sessions/others')

    if (error) {
      toast.error('Something went wrong while revoking the sessions')
      return
    }

    toast.success('The other sessions have been revoked')
    getQueryClient().invalidateQueries({ queryKey: ['sessions'] })
  }

  return (
    <AlertDialog {...props}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hold on!</AlertDialogTitle>

          <AlertDialogDescription>
            Every session except the current one is about to be revoked. Devices
            using those sessions will lose access until they log in again.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>

          <AlertDialogAction onClick={handleRevokeOtherSessions}>
            Revoke
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

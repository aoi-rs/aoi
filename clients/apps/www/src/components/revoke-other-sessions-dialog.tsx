'use client'

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
import { useStore } from '@/providers/store'
import { service } from '@/utils/client'

interface RevokeOtherSessionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RevokeOtherSessionsDialog({
  ...props
}: RevokeOtherSessionsDialogProps) {
  const store = useStore()

  async function handleRevokeOtherSessions() {
    const { error } = await service.DELETE('/v1/sessions/others')

    if (error) {
      toast.error('Something went wrong while revoking the other sessions')
      return
    }

    toast.success('The other sessions have been revoked')

    for (const session of store.sessions) {
      if (!session.is_current_session) {
        store.remove(session)
      }
    }

    props.onOpenChange(false)
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

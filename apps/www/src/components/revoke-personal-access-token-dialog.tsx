'use client'

import { useRouter } from 'next/navigation'
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

interface RevokePersonalAccessTokenDialogProps
  extends ComponentProps<typeof AlertDialog> {
  id: string
}

export function RevokePersonalAccessTokenDialog({
  id,
  ...props
}: RevokePersonalAccessTokenDialogProps) {
  const router = useRouter()

  async function handleRevokePersonalAccessToken() {
    const { error } = await service.DELETE('/v1/personal_access_tokens/{id}', {
      params: { path: { id } },
    })

    if (error) {
      toast.error('Something went wrong while revoking the PAT')
      return
    }

    toast.success('The PAT has been revoked')
    router.push('/settings')
  }

  return (
    <AlertDialog {...props}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hold on!</AlertDialogTitle>

          <AlertDialogDescription>
            This token is about to lose access to the API permanently. Make sure
            nothing important is still using it.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>

          <AlertDialogAction onClick={handleRevokePersonalAccessToken}>
            Revoke
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

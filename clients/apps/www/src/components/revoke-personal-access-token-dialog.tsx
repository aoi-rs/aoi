'use client'

import type { PersonalAccessToken } from '@aoi-rs/local'
import { useRouter } from 'next/navigation'
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

interface RevokePersonalAccessTokenDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  token: PersonalAccessToken
}

export function RevokePersonalAccessTokenDialog({
  token,
  ...props
}: RevokePersonalAccessTokenDialogProps) {
  const router = useRouter()
  const store = useStore()

  async function handleRevokePersonalAccessToken() {
    const { error } = await service.DELETE('/v1/personal_access_tokens/{id}', {
      params: { path: { id: token.id } },
    })

    if (error) {
      toast.error('Something went wrong while revoking the PAT')
      return
    }

    toast.success('The PAT has been revoked')
    store.remove(token)

    router.push('/settings')
    props.onOpenChange(false)
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

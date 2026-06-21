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

interface LogoutDialogProps extends ComponentProps<typeof AlertDialog> {}

export function LogoutDialog(props: LogoutDialogProps) {
  const router = useRouter()

  async function handleLogout() {
    const { error } = await service.DELETE('/v1/auth/logout')

    if (error) {
      toast.error('Something went wrong while logging out')
      return
    }

    router.push('/')
  }

  return (
    <AlertDialog {...props}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hold on!</AlertDialogTitle>

          <AlertDialogDescription>
            You're about to log out of this device. You'll need to log in again
            to continue using your account.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleLogout}>Log out</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

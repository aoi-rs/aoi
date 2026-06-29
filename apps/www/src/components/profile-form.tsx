'use client'

import { Avatar } from '@base-ui/react/avatar'
import { useContext } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import type { schemas } from '@/generated/server'
import { UserContext } from '@/providers/user'
import { service } from '@/utils/client'
import { ListView, ListViewContent, ListViewDescription, ListViewDetails, ListViewItem, ListViewTitle } from '@/app/(dashboard)/settings/_components/list-view'

export function ProfileForm() {
  const { user, setUser } = useContext(UserContext)

  const form = useForm({
    defaultValues: {
      name: user?.name ?? '',
    },
  })

  async function handleSubmit({ name }: { name: string }) {
    const _name = name.trim()

    if (_name === user?.name) {
      return
    }

    if (!_name && !user?.name) {
      return
    }

    if (!_name) {
      toast.error('Your full name cannot be empty')
      return
    }

    setUser((u) => ({ ...u, name }))
    toast.success('Profile details saved')

    const { error } = await service.PATCH('/v1/user', { body: { name } })

    if (error) {
      toast.error('Something went wrong while updating your profile')
      setUser(user as schemas['UserSchema'])
    }
  }

  async function submit() {
    const handler = form.handleSubmit(handleSubmit)
    await handler()
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)}>
      <ListView>
        <ListViewContent>
          <ListViewItem>
            <ListViewDetails>
              <ListViewTitle>Picture</ListViewTitle>

              <ListViewDescription>
                Best viewed at 256x256
              </ListViewDescription>
            </ListViewDetails>

            <Avatar.Root className="group/avatar relative flex size-8 shrink-0 rounded-md select-none after:absolute after:inset-0 after:rounded-md after:border after:border-[oklch(0.2974_0.0048_270.79)] after:mix-blend-darken data-[size=lg]:size-10 data-[size=sm]:size-6 dark:after:mix-blend-lighten">
              <Avatar.Image
                className="rounded-md"
                src="/preview-avatar.png"
                alt={user?.name ?? 'You'}
              />
            </Avatar.Root>
          </ListViewItem>

          <ListViewItem>
            <ListViewDetails>
              <ListViewTitle>Full name</ListViewTitle>

              <ListViewDescription>
                The name tied to your profile
              </ListViewDescription>
            </ListViewDetails>

            <Input
              className="w-50 h-8 text-white text-[.8125rem] leading-[normal] border-[oklch(0.2974_0.0048_270.79)] bg-transparent py-1.5 rounded-lg placeholder:text-[oklch(0.4692_0.0036_271.21)]"
              placeholder="Your name"
              {...form.register('name', { onBlur: submit })}
            />
          </ListViewItem>
        </ListViewContent>
      </ListView>
    </form>
  )
}

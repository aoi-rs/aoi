'use client'

import { Avatar } from '@base-ui/react/avatar'
import { useContext } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import type { schemas } from '@/generated/server'
import { UserContext } from '@/providers/user'
import { service } from '@/utils/client'

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
      <div className="rounded-2xl bg-asahi-850 border border-asahi-700 bg-asahi-800">
        <ul className="flex flex-col divide-asahi-700 divide-y">
          <li className="p-4 flex items-center gap-3">
            <div className="flex flex-col flex-1">
              <span className="text-sm font-medium">Picture</span>

              <span className="text-xs font-[450] text-asahi-500">
                Best viewed at 256x256
              </span>
            </div>

            <Avatar.Root className="group/avatar relative flex size-8 shrink-0 rounded-md select-none after:absolute after:inset-0 after:rounded-md after:border after:border-asahi-700 after:mix-blend-darken data-[size=lg]:size-10 data-[size=sm]:size-6 dark:after:mix-blend-lighten">
              <Avatar.Image
                className="rounded-md"
                src="/preview-avatar.png"
                alt={user?.name ?? 'You'}
              />
            </Avatar.Root>
          </li>

          <li className="p-4 flex items-center gap-3">
            <div className="flex flex-col flex-1">
              <span className="text-sm font-medium">Full name</span>

              <span className="text-xs font-[450] text-asahi-500">
                The name tied to your profile
              </span>
            </div>

            <Input
              className="w-64"
              placeholder="Your name"
              {...form.register('name', { onBlur: submit })}
            />
          </li>
        </ul>
      </div>
    </form>
  )
}

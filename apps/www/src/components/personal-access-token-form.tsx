'use client'

import { useRouter } from 'next/navigation'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { schemas } from '@/generated/server'
import { service } from '@/utils/client'
import { getQueryClient } from '@/utils/query'

const PERMISSION_SUBJECTS = [
  { name: 'user', label: 'Profile' },
  { name: 'sessions', label: 'Sessions' },
  { name: 'personal_access_tokens', label: 'PATs' },
  { name: 'links', label: 'Links' },
]

const PERMISSION_SELECT_ITEMS = [
  { label: 'Disabled', value: 'none' },
  { label: 'Read-only', value: 'read' },
  { label: 'Read & Write', value: 'write' },
]

interface FormSchema {
  label: string
  user_permission: 'none' | 'read' | 'write'
  sessions_permission: 'none' | 'read' | 'write'
  personal_access_tokens_permission: 'none' | 'read' | 'write'
  links_permission: 'none' | 'read' | 'write'
}

interface PersonalAccessTokenFormProps {
  token: schemas['PersonalAccessTokenSchema']
}

export default function PersonalAccessTokenForm({
  token,
}: PersonalAccessTokenFormProps) {
  const defaults: FormSchema = {
    label: token.name,
    user_permission: 'none',
    sessions_permission: 'none',
    links_permission: 'none',
    personal_access_tokens_permission: 'none',
  }

  for (const permission of token.permissions) {
    const separator = permission.lastIndexOf('_')

    const resource = permission.slice(0, separator)
    const level = permission.slice(separator + 1)

    const key = (resource + '_permission') as keyof typeof defaults

    if (defaults[key] === 'none' || defaults[key] === 'read') {
      defaults[key] = level as 'read' | 'write'
    }
  }

  const form = useForm<FormSchema>({
    defaultValues: defaults,
  })

  const router = useRouter()

  function handleCancel() {
    if (window.history.length > 1) {
      router.back()
      return
    }

    router.replace('/settings/tokens/' + token.id)
  }

  async function handleSubmit(details: FormSchema) {
    const { data, error } = await service.PATCH(
      '/v1/personal_access_tokens/{id}',
      {
        params: {
          path: {
            id: token.id,
          },
        },
        body: {
          name: details.label,
          permissions: buildPermissionList(details),
        },
      },
    )

    if (error) {
      toast.error('Something went wrong while saving the PAT')
      return
    }

    getQueryClient().invalidateQueries({
      queryKey: ['personal_access_tokens'],
    })

    toast.success('The PAT has been saved')
    router.push('/settings/tokens/' + data.id)
  }

  return (
    <div className="flex flex-col mt-4 mb-8 mx-5.5 sm:mx-10 sm:my-16 items-center">
      <div className="w-full max-w-160 flex flex-col gap-8">
        <div className="px-4 flex flex-col gap-1">
          <h1 className="text-2xl font-medium">Edit PAT</h1>

          <p className="text-aoi-500 font-[450] text-sm">
            Use a PAT to automate workflows and connect external tools
          </p>
        </div>

        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-col gap-12"
        >
          <div className="rounded-2xl bg-aoi-850 border border-aoi-700 bg-aoi-800">
            <ul className="flex flex-col divide-aoi-700 divide-y">
              <Controller
                name="label"
                control={form.control}
                render={({ field }) => (
                  <li className="p-4 flex flex-col gap-2 items-stretch sm:items-center sm:flex-row sm:gap-3">
                    <div className="flex flex-col flex-1">
                      <label
                        htmlFor={field.name}
                        className="text-sm font-medium"
                      >
                        Label
                      </label>

                      <span className="text-xs font-[450] text-aoi-500">
                        Choose a name that helps identify this token later
                      </span>
                    </div>

                    <Input
                      {...field}
                      id={field.name}
                      className="sm:w-64"
                      placeholder="Production API"
                    />
                  </li>
                )}
              />
            </ul>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-0.5 px-4">
              <h2 className="text-sm font-medium">Permissions</h2>

              <p className="text-sm font-[450] text-aoi-500">
                Choose the minimal permissions necessary for your needs
              </p>
            </div>

            <div className="rounded-2xl bg-aoi-800 border border-aoi-700">
              <ul className="flex flex-col divide-aoi-700 divide-y">
                {PERMISSION_SUBJECTS.map((sub) => (
                  <Controller
                    key={sub.name}
                    name={(sub.name + '_permission') as keyof typeof defaults}
                    render={({ field }) => (
                      <li className="py-4 px-2.5 sm:px-4 flex items-center justify-between">
                        <Label>{sub.label}</Label>

                        <Select
                          items={PERMISSION_SELECT_ITEMS}
                          name={field.name}
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="w-32" size="sm">
                            <SelectValue />
                          </SelectTrigger>

                          <SelectContent>
                            {PERMISSION_SELECT_ITEMS.map((item) => (
                              <SelectItem key={item.value} value={item.value}>
                                {item.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </li>
                    )}
                    control={form.control}
                  />
                ))}
              </ul>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-end">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleCancel}
            >
              Cancel
            </Button>

            <Button type="submit" size="sm" className="w-fit self-end">
              Save
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function buildPermissionList({
  user_permission,
  sessions_permission,
  personal_access_tokens_permission,
  links_permission,
}: FormSchema) {
  const permissions: schemas['Permission'][] = []

  if (user_permission !== 'none') {
    permissions.push('user_read')

    if (user_permission === 'write') {
      permissions.push('user_write')
    }
  }

  if (sessions_permission !== 'none') {
    permissions.push('sessions_read')

    if (sessions_permission === 'write') {
      permissions.push('sessions_write')
    }
  }

  if (personal_access_tokens_permission !== 'none') {
    permissions.push('personal_access_tokens_read')

    if (personal_access_tokens_permission === 'write') {
      permissions.push('personal_access_tokens_write')
    }
  }

  if (links_permission !== 'none') {
    permissions.push('links_read')

    if (links_permission === 'write') {
      permissions.push('links_write')
    }
  }

  return permissions
}

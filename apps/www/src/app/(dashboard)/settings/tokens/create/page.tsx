'use client'

import { useRouter } from 'next/navigation'
import { useContext } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { schemas } from '@/generated/server'
import { PersonalAccessTokenContext } from '@/providers/personal-access-tokens'
import { service } from '@/utils/client'
import { getQueryClient } from '@/utils/query'
import {
  ListView,
  ListViewContent,
  ListViewDescription,
  ListViewDetails,
  ListViewItem,
  ListViewTitle,
} from '../../_components/list-view'

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

const LIFETIME_SELECT_ITEMS = [
  { label: '1 day', value: 'P1D' },
  { label: '7 days', value: 'P7D' },
  { label: '30 days', value: 'P30D' },
  { label: '90 days', value: 'P90D' },
  { label: 'Forever', value: 'unlimited' },
]

interface FormSchema {
  label: string
  lifetime: string
  user_permission: 'none' | 'read' | 'write'
  sessions_permission: 'none' | 'read' | 'write'
  personal_access_tokens_permission: 'none' | 'read' | 'write'
  links_permission: 'none' | 'read' | 'write'
}

export default function CreatePersonalAccessToken() {
  const form = useForm<FormSchema>({
    defaultValues: {
      label: '',
      lifetime: 'P30D',
      user_permission: 'none',
      sessions_permission: 'none',
      personal_access_tokens_permission: 'none',
      links_permission: 'none',
    },
  })

  const { setGenerated } = useContext(PersonalAccessTokenContext)

  const router = useRouter()

  async function handleSubmit(details: FormSchema) {
    const { data, error } = await service.POST('/v1/personal_access_tokens/', {
      body: {
        name: details.label,
        expires_in: details.lifetime === 'unlimited' ? null : details.lifetime,
        permissions: buildPermissionList(details),
      },
    })

    if (error) {
      toast.error('Something went wrong while creating the PAT')
      return
    }

    setGenerated(data.token)

    getQueryClient().invalidateQueries({
      queryKey: ['personal_access_tokens'],
    })

    toast.success('The PAT has been created')
    router.push('/settings/tokens/' + data.personal_access_token.id)
  }

  return (
    <div className="flex flex-col mt-4 mb-8 mx-5.5 sm:mx-10 sm:my-16 items-center">
      <div className="w-full max-w-160 flex flex-col gap-8">
        <div className="px-4 flex flex-col gap-1">
          <h1 className="text-2xl font-medium text-white">Create a PAT</h1>

          <p className="text-[oklch(0.6674_0.003_271.37)] font-[450] text-sm">
            Use a PAT to automate workflows and connect external tools
          </p>
        </div>

        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-col gap-12"
        >
          <ListView>
            <ListViewContent>
              <Controller
                name="label"
                control={form.control}
                render={({ field }) => (
                  <ListViewItem className="flex flex-col gap-2 items-stretch sm:items-center sm:flex-row sm:gap-4">
                    <ListViewDetails>
                      <ListViewTitle
                        render={<label htmlFor={field.name}>Label</label>}
                      />

                      <ListViewDescription>
                        Choose a name that helps identify this token later
                      </ListViewDescription>
                    </ListViewDetails>

                    <Input
                      {...field}
                      id={field.name}
                      className="w-50 h-8 text-white text-[.8125rem] leading-[normal] border-[oklch(0.2974_0.0048_270.79)] bg-transparent py-1.5 rounded-lg placeholder:text-[oklch(0.4692_0.0036_271.21)]"
                      placeholder="Production API"
                    />
                  </ListViewItem>
                )}
              />

              <Controller
                name="lifetime"
                render={({ field }) => (
                  <ListViewItem className="flex flex-col gap-2 items-stretch sm:items-center sm:flex-row sm:gap-4">
                    <ListViewDetails>
                      <ListViewTitle
                        render={
                          <label htmlFor="lifetime-select">Lifetime</label>
                        }
                      />

                      <ListViewDescription>
                        Choose how long this token should remain active
                      </ListViewDescription>
                    </ListViewDetails>

                    <Select
                      name={field.name}
                      value={field.value}
                      onValueChange={field.onChange}
                      items={LIFETIME_SELECT_ITEMS}
                    >
                      <SelectTrigger
                        id="lifetime-select"
                        className="w-32"
                        size="sm"
                      >
                        <SelectValue />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectGroup>
                          {LIFETIME_SELECT_ITEMS.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </ListViewItem>
                )}
                control={form.control}
              />
            </ListViewContent>
          </ListView>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-0.5 px-4">
              <h2 className="text-sm font-medium text-white">Permissions</h2>

              <p className="text-sm font-[450] text-[oklch(0.6674_0.003_271.37)]">
                Choose the minimal permissions necessary for your needs
              </p>
            </div>

            <ListView>
              <ListViewContent>
                {PERMISSION_SUBJECTS.map((sub) => (
                  <Controller
                    key={sub.name}
                    name={(sub.name + '_permission') as keyof FormSchema}
                    render={({ field }) => (
                      <ListViewItem className="justify-between">
                        <ListViewTitle render={<label htmlFor={sub.name}>{sub.label}</label>} />

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
                      </ListViewItem>
                    )}
                    control={form.control}
                  />
                ))}
              </ListViewContent>
            </ListView>
          </div>

          <Button type="submit" size="sm" className="w-fit self-end">
            Create token
          </Button>
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

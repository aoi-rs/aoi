'use client'

import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
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

export const FORM_ID = 'create-personal-access-token-form'

interface FormSchema {
  label: string
}

const ALL_PERMISSIONS: schemas['Permission'][] = [
  'user_read',
  'user_write',
  'sessions_read',
  'sessions_write',
  'personal_access_tokens_read',
  'personal_access_tokens_write',
  'links_read',
  'links_write',
]

const PERMISSION_SUBJECTS = [
  { name: 'user', label: 'Profile' },
  { name: 'sessions', label: 'Sessions' },
  { name: 'personal_access_tokens', label: 'PATs' },
  { name: 'links', label: 'Links' },
]

const PERMISSION_SELECT_ITEMS = [
  { label: 'Disabled', value: 'none' },
  { label: 'Read', value: 'read' },
  { label: 'Read & Write', value: 'write' },
]

export function CreatePersonalAccessTokenForm() {
  const form = useForm<FormSchema>()

  async function handleSubmit({ label }: FormSchema) {
    const { error } = await service.POST('/v1/personal_access_tokens/', {
      body: { name: label, permissions: ALL_PERMISSIONS },
    })

    if (error) {
      toast.error('Something went wrong while creating the API key')
      return
    }

    getQueryClient().invalidateQueries({
      queryKey: ['personal_access_tokens'],
    })
  }

  return (
    <form
      id={FORM_ID}
      className="px-4 flex flex-col gap-4"
      onSubmit={form.handleSubmit(handleSubmit)}
    >
      <div className="flex flex-col gap-2">
        <Label>Label</Label>
        <Input />
      </div>

      {PERMISSION_SUBJECTS.map((sub) => (
        <div className="flex justify-between items-center" key={sub.name}>
          <span className="font-medium">{sub.label}</span>

          <Select defaultValue="Disabled" items={PERMISSION_SELECT_ITEMS}>
            <SelectTrigger className="w-32">
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
        </div>
      ))}
    </form>
  )
}

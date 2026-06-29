'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { service } from '@/utils/client'
import { getQueryClient } from '@/utils/query'

const formSchema = z.object({
  name: z.string(),
  destination_url: z.url({
    error: (iss) =>
      iss.input === undefined
        ? 'Please enter a destination URL'
        : 'Please enter a valid URL',
  }),
})

export const FORM_ID = 'create-link-form'

interface CreateLinkFormProps {
  onCreate: () => void
}

export function CreateLinkForm({ onCreate }: CreateLinkFormProps) {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', destination_url: '' },
  })

  async function handleSubmit({
    name,
    destination_url,
  }: z.infer<typeof formSchema>) {
    const _name = name.trim()

    const { error } = await service.POST('/v1/links/', {
      body: { name: _name || null, destination_url },
    })

    if (error) {
      toast.error('Something went wrong while creating the link')
      return
    }

    toast.success('The link has been created')
    getQueryClient().invalidateQueries({ queryKey: ['links'] })

    onCreate()
  }

  return (
    <form
      id={FORM_ID}
      className="px-4 py-3 flex flex-col gap-6"
      onSubmit={form.handleSubmit(handleSubmit)}
    >
      <Controller
        name="name"
        render={({ field }) => (
          <div className="flex flex-col gap-1">
            <Label htmlFor={FORM_ID + '-label'}>Label</Label>

            <Input
              {...field}
              id={FORM_ID + '-label'}
              placeholder="Course materials"
              className="bg-transparent border h-8 text-white border-[oklch(0.2881_0.006_270.55)] rounded-lg py-1.5 px-3 placeholder:text-[oklch(0.4822_0.0036_271.22)]"
            />
          </div>
        )}
        control={form.control}
      />

      <Controller
        name="destination_url"
        render={({ field }) => (
          <div className="flex flex-col gap-1">
            <Label htmlFor={FORM_ID + '-destination-url'}>URL</Label>

            <Input
              {...field}
              id={FORM_ID + '-destination-url'}
              placeholder="https://"
              className="bg-transparent border h-8 text-white border-[oklch(0.2881_0.006_270.55)] rounded-lg py-1.5 px-3 placeholder:text-[oklch(0.4822_0.0036_271.22)]"
            />
          </div>
        )}
        control={form.control}
      />
    </form>
  )
}

'use client'

import { type KeyboardEvent, useRef } from 'react'
import { toast } from 'sonner'
import type { schemas } from '@/generated/server'
import { service } from '@/utils/client'
import { getQueryClient } from '@/utils/query'

interface LinkLabelEditorProps {
  link: schemas['LinkSchema']
  onSubmit: (name: string | null) => void
}

export function LinkLabelEditor({ link, onSubmit }: LinkLabelEditorProps) {
  const ref = useRef<HTMLDivElement>(null)

  async function handleFlush(editable: HTMLDivElement) {
    const content = editable.innerText
    const value = content.trim() || null

    if (value === link.name) {
      if (content !== value) {
        editable.innerHTML = value ?? ''
      }

      return
    }

    const { data, error } = await service.PATCH('/v1/links/{id}', {
      params: { path: { id: link.id } },
      body: { name: value },
    })

    if (error) {
      toast.error('There was an error while saving the link')
      return
    }

    if (content !== data.name) {
      editable.innerHTML = data.name ?? ''
    }

    getQueryClient().invalidateQueries({ queryKey: ['links'] })

    onSubmit(data.name)

    toast.success('The link was edited')
  }

  async function handleKeyDown(event: KeyboardEvent) {
    if (ref.current) {
      if (event.key === 'Enter' || event.key === 'Escape') {
        ref.current.blur()
      }
    }
  }

  async function handleBlur() {
    if (ref.current) {
      await handleFlush(ref.current)
    }
  }

  return (
    <div
      ref={ref}
      data-empty-text="Untitled"
      className="wrap-anywhere cursor-text resize-none whitespace-pre-wrap font-semibold text-2xl text-white before:pointer-events-none before:float-left before:hidden before:h-0 before:text-[oklch(0.4511_0.003_271.26)] before:content-[attr(data-empty-text)] empty:before:inline focus:outline-none has-[>br:only-child]:before:inline"
      role="textbox"
      aria-readonly="false"
      aria-multiline="false"
      aria-label="Link label"
      translate="no"
      contentEditable
      spellCheck
      suppressContentEditableWarning
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
    >
      {link.name}
    </div>
  )
}

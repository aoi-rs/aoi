'use client'

import { type KeyboardEvent, useRef } from 'react'
import { toast } from 'sonner'
import type { schemas } from '@/generated/server'
import { service } from '@/utils/client'

interface LinkLabelEditorProps {
  link: schemas['LinkSchema']
}

export function LinkLabelEditor({ link }: LinkLabelEditorProps) {
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
    // biome-ignore lint/a11y/useFocusableInteractive: contenteditable elements are natively focusable
    // biome-ignore lint/a11y/useSemanticElements: This editor requires custom behavior that couldn't be achieved with more traditional elements like <input> and <textarea>. The element is exposed to assistive technologies through role="textbox" and related ARIA attributes
    <div
      ref={ref}
      data-empty-text="Untitled"
      className="text-2xl text-white font-semibold cursor-text whitespace-pre-wrap wrap-anywhere focus:outline-none resize-none before:content-[attr(data-empty-text)] before:hidden before:float-left before:pointer-events-none before:h-0 before:text-aoi-600 empty:before:inline has-[>br:only-child]:before:inline"
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

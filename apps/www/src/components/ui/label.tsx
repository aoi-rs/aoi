'use client'

import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

function Label({ className, ...props }: ComponentProps<'label'>) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: This component accepts the props needed and should be used as a common label
    <label
      data-slot="label"
      className={cn(
        'flex items-center gap-2 text-sm leading-6 font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

export { Label }

import { Input as InputPrimitive } from '@base-ui/react/input'
import type * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        'flex h-10 w-full rounded-xl border border-[oklch(0.2684_0.004_264.5)] bg-[oklch(0.1689_0.0021_286.18)] px-3 text-sm file:border-0 file:bg-transparent file:font-medium file:text-sm placeholder:text-[oklch(0.4493_0.0035_264.53)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

export { Input }

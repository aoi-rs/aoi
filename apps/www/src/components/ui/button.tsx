import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const button = cva(
  'inline-flex items-center justify-center gap-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-3.5! [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-asahi-50 text-asahi-900 hover:bg-asahi-50/90',
        outline: 'border border-asahi-700 bg-asahi-800 hover:bg-asahi-700',
        ghost: 'hover:bg-asahi-700 text-white',
        destructive: 'bg-red-600 hover:bg-red-500 text-white',
        link: 'text-asahi-50 underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 px-3',
        icon: 'size-6',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof button>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(button({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, button }

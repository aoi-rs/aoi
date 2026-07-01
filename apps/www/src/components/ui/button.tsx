import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const button = cva(
  'inline-flex items-center justify-center gap-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-3.5! [&_svg]:shrink-0 cursor-default',
  {
    variants: {
      variant: {
        default: 'bg-aoi-50 text-aoi-900 hover:bg-aoi-50/90',
        secondary:
          'bg-[oklch(0.2269_0.0019_286.25)] hover:bg-[oklch(0.268_0.0024_247.91)]',
        ghost: 'hover:bg-accent text-white',
        destructive: 'bg-red-600 hover:bg-red-500 text-white',
        link: 'underline-offset-2.5 hover:underline',
      },
      size: {
        default: 'h-10 px-4.5',
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

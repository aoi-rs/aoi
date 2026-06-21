import type { ComponentProps } from 'react'

export function Logomark(props: ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={24}
      height={24}
      {...props}
    >
      <path
        d="M16 0A8 8 0 0 1 8 8H0A8 8 0 0 1 8 0H16A8 8 0 0 1 24 8V16A8 8 0 0 1 16 24V16A8 8 0 0 0 0 16A8 8 0 0 0 16 16A8 8 0 0 1 24 8A8 8 0 0 1 16 0Z"
        fill="currentColor"
      />
    </svg>
  )
}

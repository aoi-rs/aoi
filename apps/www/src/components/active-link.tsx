'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ComponentProps } from 'react'

/**
 * Props for {@link ActiveLink}
 */
export interface ActiveLinkProps extends ComponentProps<typeof Link> {
  /**
   * Determines whether the link should be considered active for the current
   * pathname.
   *
   * - If a string is provided, the pathname must match it exactly.
   * - If a regular expression is provided, the pathname must satisfy it.
   */
  matcher: string | RegExp
}

/**
 * A wrapper around 'next/link' that marks itself as active when its
 * destination matches the current pathname.
 *
 * The rendered link receives a `data-active` attribute, allowing styles to be
 * applied based on whether the link points to the current page.
 */
export function ActiveLink(props: ActiveLinkProps) {
  const pathname = usePathname()

  const active =
    typeof props.matcher === 'string'
      ? pathname === props.matcher
      : props.matcher.test(pathname)

  return <Link data-active={active} {...props} />
}

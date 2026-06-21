'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ComponentProps } from 'react'

/**
 * Props for {@link ActiveLink}
 */
export interface ActiveLinkProps extends ComponentProps<typeof Link> {}

const TRAILING_SLASH_REGEXP = /\/$/

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
    props.href.toString().replace(TRAILING_SLASH_REGEXP, '') ===
    pathname.replace(TRAILING_SLASH_REGEXP, '')

  return <Link data-active={active} {...props} />
}

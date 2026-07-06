'use client'

import { mergeProps, useRender } from '@base-ui/react'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

function ListView({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="list-view"
      className={cn(
        'divide-y divide-[oklch(0.2415_0.0048_270.59)] rounded-2xl border border-[oklch(0.2415_0.0048_270.59)] bg-[oklch(0.2041_0.002_271.15)]',
        className,
      )}
      {...props}
    />
  )
}

function ListViewHeader({ className, ...props }: ComponentProps<'header'>) {
  return (
    <header
      data-slot="list-view-header"
      className={cn(
        'flex items-center justify-between p-4 font-medium text-sm text-white **:data-[slot=button]:hover:bg-[oklch(0.2541_0.0025_271.11)]',
        className,
      )}
      {...props}
    />
  )
}

function ListViewContent({ className, ...props }: ComponentProps<'ul'>) {
  return (
    <ul
      data-slot="list-view-content"
      className="group/content flex flex-col divide-y divide-[oklch(0.2415_0.0048_270.59)]"
      {...props}
    />
  )
}

function ListViewItem({ children, className, ...props }: ComponentProps<'li'>) {
  return (
    <li
      className={cn(
        'group/item relative flex items-center gap-3 p-4 last:rounded-b-2xl group-first/content:first:rounded-t-2xl has-data-[slot=list-view-clickable]:hover:bg-[oklch(0.2275_0.0032_270.9)] **:data-[slot=button]:z-10 **:data-[slot=button]:opacity-0 **:data-[slot=button]:hover:bg-[oklch(0.2541_0.0025_271.11)] hover:**:data-[slot=button]:opacity-100',
        className,
      )}
      {...props}
    >
      {children}
    </li>
  )
}

function ListViewClickable({
  render,
  className,
  ...props
}: useRender.ComponentProps<'div'>) {
  return useRender({
    defaultTagName: 'div',
    props: mergeProps<'div'>(
      {
        className: cn(
          'inset-0 absolute block cursor-default group-last/item:rounded-b-2xl group-first/content:group-first/item:rounded-t-2xl',
          className,
        ),
      },
      props,
    ),
    render,
    state: {
      slot: 'list-view-clickable',
    },
  })
}

function ListViewBadge({ className, ...props }: ComponentProps<'figure'>) {
  return (
    <figure
      className={cn(
        "grid size-8 place-content-center rounded-md bg-[oklch(0.2432_0.0068_270.2)] text-[oklch(0.6784_0.0036_271.33)] [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  )
}

function ListViewDetails({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div className={cn('flex w-full flex-col gap-0.5', className)} {...props} />
  )
}

function ListViewTitle({
  render,
  className,
  ...props
}: useRender.ComponentProps<'span'>) {
  return useRender({
    defaultTagName: 'span',
    props: mergeProps(
      {
        className: cn(
          'text-[.8125rem] leading-4 font-medium flex items-center gap-2',
          className,
        ),
      },
      props,
    ),
    render,
    state: {
      slot: 'list-view-title',
    },
  })
}

function ListViewDescription({ className, ...props }: ComponentProps<'span'>) {
  return (
    <span
      className={cn(
        'font-[450] text-[oklch(0.6784_0.0036_271.33)] text-xs leading-4',
        className,
      )}
      {...props}
    />
  )
}

export {
  ListView,
  ListViewBadge,
  ListViewClickable,
  ListViewContent,
  ListViewDescription,
  ListViewDetails,
  ListViewHeader,
  ListViewItem,
  ListViewTitle,
}

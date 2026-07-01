'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import type { schemas } from '@/generated/server'
import { useMediaQuery } from '@/hooks/use-media-query'
import { LinkList } from './link-list'
import { LinksHeader } from './links-header'

interface LinkPanelsProps {
  links: schemas['ListResource_LinkSchema_']
  children: ReactNode
}

export function LinkPanels({ links, children }: LinkPanelsProps) {
  const pathname = usePathname()
  const shouldRenderPanels = useMediaQuery('(width >= 48rem)')

  if (!shouldRenderPanels) {
    if (pathname === '/links') {
      return (
        <div
          data-variant="normal"
          className="flex flex-col size-full group/links-layout"
        >
          <LinksHeader />
          <LinkList links={links} />
        </div>
      )
    }

    return (
      <div data-variant="normal" className="size-full group/links-layout">
        {children}
      </div>
    )
  }

  return (
    <div
      data-variant="panels"
      className="flex-1 flex flex-col group/links-layout"
    >
      <ResizablePanelGroup orientation="horizontal">
        <ResizablePanel minSize={300} maxSize="50%">
          <div className="flex flex-col size-full">
            <LinksHeader />
            <LinkList links={links} />
          </div>
        </ResizablePanel>

        <ResizableHandle />

        <ResizablePanel>{children}</ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}

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
          className="group/links-layout flex size-full flex-col"
        >
          <LinksHeader />
          <LinkList links={links} />
        </div>
      )
    }

    return (
      <div data-variant="normal" className="group/links-layout size-full">
        {children}
      </div>
    )
  }

  return (
    <div
      data-variant="panels"
      className="group/links-layout flex flex-1 flex-col"
    >
      <ResizablePanelGroup orientation="horizontal">
        <ResizablePanel minSize={300} maxSize="50%">
          <div className="flex size-full flex-col">
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

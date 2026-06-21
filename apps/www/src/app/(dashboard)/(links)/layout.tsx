import type { ReactNode } from 'react'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { createSSRClient } from '@/utils/client/serverside'
import { listLinks } from '@/utils/link'
import { LinkList } from './_components/link-list'
import { LinksHeader } from './_components/links-header'

interface LinksLayoutProps {
  children: ReactNode
}

export default async function LinksLayout({ children }: LinksLayoutProps) {
  const client = await createSSRClient()
  const links = await listLinks(client)

  return (
    <div className="flex-1 flex flex-col">
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

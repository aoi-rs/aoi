import type { ReactNode } from 'react'
import { createSSRClient } from '@/utils/client/serverside'
import { listLinks } from '@/utils/link'
import { LinkPanels } from './_components/link-panels'

interface LinksLayoutProps {
  children: ReactNode
}

export default async function LinksLayout({ children }: LinksLayoutProps) {
  const client = await createSSRClient()
  const links = await listLinks(client)

  return <LinkPanels links={links}>{children}</LinkPanels>
}

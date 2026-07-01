import { LayersPlus } from 'lucide-react'
import Link from 'next/link'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { createSSRClient } from '@/utils/client/serverside'
import { shortenCreationDate } from '@/utils/date'
import { retrieveLink } from '@/utils/link'
import { LinkCard } from './_components/link-card'
import { LinkLabelEditor } from './_components/link-label-editor'

interface LinkProps {
  params: Promise<{ id: string }>
}

export default async function _Link({ params }: LinkProps) {
  const { id } = await params

  const client = await createSSRClient()
  const link = await retrieveLink(client, id)

  return (
    <div className="flex flex-col h-full">
      <header className="flex h-10.75 shrink-0 items-center px-2 border-b border-[oklch(0.2143_0.0037_270.75)] transition-[width,height] ease-linear">
        <div className="flex items-center flex-1 gap-1.5">
          <div className="flex flex-1 items-center gap-0.5 sm:gap-1">
            <SidebarTrigger className="group-data-[variant=panels]/links-layout:hidden" />

            <span className="text-[oklch(0.917_0.003_271.43)] text-sm font-medium text-ellipsis whitespace-nowrap overflow-hidden flex-1 ml-2.5 max-w-full group-data-[variant=normal]/links-layout:hidden">
              {link.name ?? 'Untitled'}
            </span>

            <Breadcrumb className="group-data-[variant=panels]/links-layout:hidden ml-2.5">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink render={<Link href="/links" />}>
                    Links
                  </BreadcrumbLink>
                </BreadcrumbItem>

                <BreadcrumbSeparator />

                <BreadcrumbItem>
                  <BreadcrumbPage>{link.name ?? 'Untitled'}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>
      </header>

      <div className="flex flex-col flex-1 w-[calc(100%-2.5rem)] mx-auto">
        <div className="mt-9.5 mb-3.5">
          <LinkLabelEditor link={link} />
        </div>

        <LinkCard link={link} />

        <Separator className="mb-4.5 mt-4" />

        <span className="my-1 font-semibold text-base text-white">
          Timeline
        </span>

        <ul className="pb-18 pt-4 pr-2.5 flex flex-col">
          <li className="pb-2 flex items-center">
            <LayersPlus className="size-3.5 text-[oklch(0.6674_0.003_271.37)] mx-3" />

            <span className="text-xs text-[oklch(0.6674_0.003_271.37)] font-[450]">
              You created the link{' '}
              <span className="inline-block text-center font-semibold w-3">
                ·
              </span>{' '}
              {shortenCreationDate(link.created_at)} ago
            </span>
          </li>
        </ul>
      </div>
    </div>
  )
}

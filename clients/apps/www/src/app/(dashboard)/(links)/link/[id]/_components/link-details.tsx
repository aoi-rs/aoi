'use client'

import { LayersPlus } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
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
import type { schemas } from '@/generated/server'
import { shortenCreationDate } from '@/utils/date'
import { LinkCard } from './link-card'
import { LinkLabelEditor } from './link-label-editor'

interface LinkDetailsProps {
  link: schemas['LinkSchema']
}

export function LinkDetails({ link: _link }: LinkDetailsProps) {
  const [link, setLink] = useState(_link)

  function handleRename(name: string | null) {
    setLink((l) => ({ ...l, name }))
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-10.75 shrink-0 items-center border-[oklch(0.2143_0.0037_270.75)] border-b px-2 transition-[width,height] ease-linear">
        <div className="flex flex-1 items-center gap-1.5">
          <div className="flex flex-1 items-center gap-0.5 sm:gap-1">
            <SidebarTrigger className="group-data-[variant=panels]/links-layout:hidden" />

            <span className="ml-2.5 max-w-full flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-medium text-[oklch(0.917_0.003_271.43)] text-sm group-data-[variant=normal]/links-layout:hidden">
              {link.name ?? 'Untitled'}
            </span>

            <Breadcrumb className="ml-2.5 group-data-[variant=panels]/links-layout:hidden">
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

      <div className="mx-auto flex w-[calc(100%-2.5rem)] flex-1 flex-col">
        <div className="mt-9.5 mb-3.5">
          <LinkLabelEditor link={link} onSubmit={handleRename} />
        </div>

        <LinkCard link={link} />

        <Separator className="mt-4 mb-4.5" />

        <span className="my-1 font-semibold text-base text-white">
          Timeline
        </span>

        <ul className="flex flex-col pt-4 pr-2.5 pb-18">
          <li className="flex items-center pb-2">
            <LayersPlus className="mx-3 size-3.5 text-[oklch(0.6674_0.003_271.37)]" />

            <span className="font-[450] text-[oklch(0.6674_0.003_271.37)] text-xs">
              You created the link{' '}
              <span className="inline-block w-3 text-center font-semibold">
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

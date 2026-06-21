'use client'

import { useQuery } from '@tanstack/react-query'
import { ActiveLink } from '@/components/active-link'
import { Avatar, AvatarImage } from '@/components/ui/avatar'
import { type schemas, unwrap } from '@/generated/server'
import { service } from '@/utils/client'
import { shortenCreationDate } from '@/utils/date'
import { defaultRetry } from '@/utils/retry'

interface LinkListProps {
  links: schemas['ListResource_LinkSchema_']
}

export function LinkList({ links: _links }: LinkListProps) {
  const { data: links } = useQuery({
    queryKey: ['links'],
    queryFn: () =>
      unwrap(
        service.GET('/v1/links/', {
          params: { query: { limit: 100 } },
        }),
      ),
    retry: defaultRetry,
    initialData: _links,
  })

  return (
    <ul className="flex-1 flex flex-col pt-2">
      {links.items.map((link) => (
        <li key={link.id}>
          <ActiveLink
            className="group/link cursor-default"
            href={'/link/' + link.id}
          >
            <div className="mx-2 px-2 items-start hover:bg-asahi-800 rounded-lg flex gap-3 group-data-[active=true]/link:bg-asahi-700!">
              <div className="pt-3 min-w-6 shrink-0 flex">
                <Avatar variant="rounded">
                  <AvatarImage src="/icon.svg" />
                </Avatar>
              </div>

              <div className="flex flex-col gap-0.5 flex-1 py-2.5">
                <span className="text-sm text-asahi-500 font-medium leading-[normal]">
                  {link.name ?? 'Untitled'}
                </span>

                <div className="h-4 flex gap-1.5">
                  <span className="text-xs text-asahi-500 font-[450] leading-[normal] flex-1">
                    Redirects to {new URL(link.destination_url).hostname}
                  </span>

                  <span className="text-asahi-500 text-xs leading-[normal]">
                    {shortenCreationDate(link.created_at)}
                  </span>
                </div>
              </div>
            </div>
          </ActiveLink>
        </li>
      ))}
    </ul>
  )
}

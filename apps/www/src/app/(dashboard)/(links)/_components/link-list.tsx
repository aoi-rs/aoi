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
    <ul className="flex flex-1 flex-col pt-2">
      {links.items.map((link) => (
        <li key={link.id}>
          <ActiveLink
            className="group/link cursor-default"
            href={'/link/' + link.id}
            matcher={'/link/' + link.id}
          >
            <div className="mx-2 flex h-13.75 items-center gap-3 rounded-lg px-2 hover:bg-[oklch(0.2_0.0021_271.12)] group-data-[active=true]/link:bg-[oklch(0.2275_0.0032_270.9)]!">
              <Avatar variant="rounded" className="shrink-0">
                <AvatarImage src="/preview-avatar.png" />
              </Avatar>

              <div className="flex flex-1 flex-col gap-0.5">
                <span className="font-medium text-[oklch(0.6674_0.003_271.37)] text-sm leading-[normal] group-data-[active=true]/link:text-[oklch(0.9221_0.0042_271.37)]">
                  {link.name ?? 'Untitled'}
                </span>

                <div className="flex h-4 gap-1.5">
                  <span className="flex-1 font-[450] text-[oklch(0.6674_0.003_271.37)] text-xs leading-[normal] group-data-[active=true]/link:text-[oklch(0.6878_0.0042_271.29)]">
                    Redirects to {new URL(link.destination_url).hostname}
                  </span>

                  <span className="text-[oklch(0.6674_0.003_271.37)] text-xs leading-[normal] group-data-[active=true]/link:text-[oklch(0.6878_0.0042_271.29)]">
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

'use client'

import { ArrowUpRight, Bookmark, BookmarkCheck, Ellipsis } from 'lucide-react'
import { toast } from 'sonner'
import { Logomark } from '@/components/brand/logomark'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { schemas } from '@/generated/server'

interface LinkCardProps {
  link: schemas['LinkSchema']
}

export function LinkCard({ link }: LinkCardProps) {
  async function handleCopyDestinationURL() {
    try {
      await navigator.clipboard.writeText(link.destination_url)
      toast.info('Destination URL copied to your clipboard')
    } catch {
      toast.error('Something went wrong')
    }
  }

  async function handleCopyShortenedURL() {
    try {
      await navigator.clipboard.writeText('https://aoi.rs/' + link.slug)
      toast.info('Shortened URL copied to your clipboard')
    } catch {
      toast.error('Something went wrong')
    }
  }

  return (
    <div className="flex h-11 items-center gap-2 rounded-lg border border-[oklch(0.2415_0.0048_270.59)] bg-[oklch(0.2041_0.002_271.15)] px-2.5">
      <Logomark className="size-4" />

      <div className="flex flex-1 gap-2 overflow-hidden">
        <div className="flex max-w-3/5 shrink-0 overflow-hidden">
          <span className="overflow-hidden text-ellipsis whitespace-nowrap font-medium text-sm text-white leading-6">
            Previews coming soon
          </span>
        </div>

        <div className="flex overflow-hidden">
          <span className="overflow-hidden text-ellipsis whitespace-nowrap font-[450] text-[oklch(0.6784_0.0036_271.33)] text-sm leading-6">
            Rich previews for destination links will be available in a future
            version.
          </span>
        </div>
      </div>

      <div className="flex shrink-0 items-center">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                size="icon"
                variant="ghost"
                className="text-[oklch(0.6784_0.0036_271.33)] hover:bg-[oklch(0.2541_0.0025_271.11)] hover:text-white"
              >
                <Ellipsis />
              </Button>
            }
          />

          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuItem
                render={
                  <a
                    href={link.destination_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ArrowUpRight />
                    Go to website
                  </a>
                }
              />
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem onClick={handleCopyDestinationURL}>
                <Bookmark />
                Copy destination URL
              </DropdownMenuItem>

              <DropdownMenuItem onClick={handleCopyShortenedURL}>
                <BookmarkCheck />
                Copy shortened URL
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

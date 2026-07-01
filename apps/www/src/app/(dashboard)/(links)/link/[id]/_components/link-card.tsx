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
    <div className="px-2.5 h-11 border border-[oklch(0.2415_0.0048_270.59)] flex items-center gap-2 rounded-lg bg-[oklch(0.2041_0.002_271.15)]">
      <Logomark className="size-4" />

      <div className="flex-1 flex overflow-hidden gap-2">
        <div className="shrink-0 max-w-3/5 flex overflow-hidden">
          <span className="whitespace-nowrap text-ellipsis leading-6 font-medium text-white overflow-hidden text-sm">
            Previews coming soon
          </span>
        </div>

        <div className="flex overflow-hidden">
          <span className="whitespace-nowrap text-ellipsis leading-6 font-[450] text-sm text-[oklch(0.6784_0.0036_271.33)] overflow-hidden">
            Rich previews for destination links will be available in a future
            version.
          </span>
        </div>
      </div>

      <div className="shrink-0 flex items-center">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                size="icon"
                variant="ghost"
                className="text-[oklch(0.6784_0.0036_271.33)] hover:text-white hover:bg-[oklch(0.2541_0.0025_271.11)]"
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

import { Clipboard, Ellipsis, LayersPlus } from 'lucide-react'
import { Logomark } from '@/components/brand/logomark'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { createSSRClient } from '@/utils/client/serverside'
import { shortenCreationDate } from '@/utils/date'
import { retrieveLink } from '@/utils/link'
import { LinkLabelEditor } from './_components/link-label-editor'

interface LinkProps {
  params: Promise<{ id: string }>
}

export default async function Link({ params }: LinkProps) {
  const { id } = await params

  const client = await createSSRClient()
  const link = await retrieveLink(client, id)

  return (
    <div className="flex flex-col h-full">
      <header className="flex h-10.75 shrink-0 items-center gap-2 px-2 border-b border-asahi-700 transition-[width,height] ease-linear">
        <div className="flex items-center justify-between gap-2 w-full">
          <span className="text-white text-sm font-medium text-ellipsis whitespace-nowrap overflow-hidden flex-1 ml-2.5 max-w-full">
            {link.name}
          </span>

          <Button
            variant="ghost"
            size="icon"
            className="text-asahi-500 hover:text-white size-7"
          >
            <Clipboard />
          </Button>
        </div>
      </header>

      <div className="flex flex-col flex-1 w-[calc(100%-2.5rem)] mx-auto">
        <div className="mt-9.5 mb-3.5">
          <LinkLabelEditor link={link} />
        </div>

        <div className="px-2.5 h-11 border border-asahi-700 flex items-center gap-2 rounded-lg bg-asahi-800">
          <Logomark className="size-4" />

          <div className="flex-1 flex overflow-hidden gap-2">
            <div className="shrink-0 max-w-3/5 flex overflow-hidden">
              <span className="whitespace-nowrap text-ellipsis leading-6 font-medium text-white overflow-hidden text-sm">
                Previews coming soon
              </span>
            </div>

            <div className="flex overflow-hidden">
              <span className="whitespace-nowrap text-ellipsis leading-6 font-[450] text-sm text-asahi-500 overflow-hidden">
                Rich previews for destination links will be available in a
                future version.
              </span>
            </div>
          </div>

          <div className="shrink-0 flex items-center">
            <Button
              size="icon"
              variant="ghost"
              className="text-asahi-500 hover:text-white"
            >
              <Ellipsis />
            </Button>
          </div>
        </div>

        <Separator className="mb-4.5 mt-4" />

        <span className="my-1 font-semibold  text-base text-white">
          Timeline
        </span>

        <ul className="pb-18 pt-4 pr-2.5 flex flex-col">
          <li className="pb-2 flex items-center">
            <LayersPlus className="size-3.5 text-asahi-500 mx-3" />

            <span className="text-xs text-asahi-500 font-[450]">
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

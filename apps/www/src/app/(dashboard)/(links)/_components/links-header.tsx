'use client'

import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { CreateLinkForm, FORM_ID } from './create-link-form'

export function LinksHeader() {
  const [creating, setCreating] = useState(false)

  return (
    <header className="flex h-10.75 shrink-0 items-center border-[oklch(0.2143_0.0037_270.75)] border-b px-2 transition-[width,height] ease-linear">
      <div className="flex flex-1 items-center justify-between gap-1.5">
        <div className="flex flex-1 items-center gap-0.5 sm:gap-1">
          <SidebarTrigger className="lg:hidden" />
          <h1 className="ml-2.5 flex-1 font-medium text-[oklch(0.917_0.003_271.43)] text-sm">
            Links
          </h1>
        </div>

        <Dialog open={creating} onOpenChange={setCreating}>
          <DialogTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-[oklch(0.6674_0.003_271.37)] hover:bg-[oklch(0.2269_0.0013_271.31)] hover:text-white"
              >
                <Plus />
              </Button>
            }
          />

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create short link</DialogTitle>

              <DialogDescription>
                Fill in the details to create a short URL
              </DialogDescription>
            </DialogHeader>

            <CreateLinkForm onCreate={() => setCreating(false)} />

            <DialogFooter>
              <Button size="sm" type="submit" form={FORM_ID}>
                Create link
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  )
}

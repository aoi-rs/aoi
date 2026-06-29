'use client'

import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
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
    <header className="flex h-10.75 shrink-0 items-center gap-2 px-2 border-b border-[oklch(0.2143_0.0037_270.75)] transition-[width,height] ease-linear">
      <div className="flex items-center justify-between flex-1 gap-1.5">
        <div className="flex flex-1 items-center gap-3 lg:gap-3.5">
          <SidebarTrigger />
          <h1 className="text-sm font-medium text-[oklch(0.917_0.003_271.43)]">Links</h1>
        </div>

        <Dialog open={creating} onOpenChange={setCreating}>
          <DialogTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="text-[oklch(0.6674_0.003_271.37)] hover:text-white hover:bg-[oklch(0.2269_0.0013_271.31)] size-7"
              >
                <Plus />
              </Button>
            }
          />

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create short URL</DialogTitle>

              <DialogDescription>
                Fill in the details to create a short URL
              </DialogDescription>
            </DialogHeader>

            <CreateLinkForm onCreate={() => setCreating(false)} />

            <DialogFooter>
              <DialogClose
                render={
                  <Button
                    size="sm"
                    variant="secondary"
                    className="bg-[oklch(0.2768_0.0025_271.15)] hover:bg-[oklch(0.3167_0.0035_271.05)]"
                  >
                    Cancel
                  </Button>
                }
              />

              <Button size="sm" type="submit" form={FORM_ID}>
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  )
}

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
    <header className="flex h-10.75 shrink-0 items-center gap-2 px-2 border-b border-aoi-700 transition-[width,height] ease-linear">
      <div className="flex items-center justify-between flex-1 gap-1.5">
        <div className="flex flex-1 items-center gap-3 lg:gap-3.5">
          <SidebarTrigger />
          <h1 className="text-sm font-medium">Links</h1>
        </div>

        <Dialog open={creating} onOpenChange={setCreating}>
          <DialogTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="text-aoi-500 hover:text-white size-7"
              >
                <Plus />
              </Button>
            }
          />

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a link</DialogTitle>

              <DialogDescription>
                Turn chaotic URLs into something less cursed
              </DialogDescription>
            </DialogHeader>

            <CreateLinkForm onCreate={() => setCreating(false)} />

            <DialogFooter>
              <DialogClose
                render={
                  <Button size="sm" variant="outline">
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

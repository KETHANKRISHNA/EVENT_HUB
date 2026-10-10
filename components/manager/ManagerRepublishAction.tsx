"use client"

import { useState, useTransition } from "react"
import { managerRepublishEventAction } from "@/actions/events"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function ManagerRepublishAction({ eventId }: { eventId: string }) {
  const [isPending, startTransition] = useTransition()
  const [isRepublishDialogOpen, setIsRepublishDialogOpen] = useState(false)

  function handleRepublish() {
    startTransition(async () => {
      const result = await managerRepublishEventAction(eventId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Event republished successfully")
        setIsRepublishDialogOpen(false)
      }
    })
  }

  return (
    <div className="w-full">
      <Button 
        variant="default" 
        className="w-full bg-green-600 hover:bg-green-700" 
        onClick={() => setIsRepublishDialogOpen(true)}
        disabled={isPending}
      >
        Republish Event
      </Button>

      <Dialog open={isRepublishDialogOpen} onOpenChange={setIsRepublishDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Republish Event</DialogTitle>
            <DialogDescription>
              Are you sure you want to republish this cancelled event? It will become visible and available for booking again, provided it has not ended and tickets are available. The cancellation history will be preserved.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRepublishDialogOpen(false)} disabled={isPending}>Go Back</Button>
            <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleRepublish} disabled={isPending}>
              {isPending ? "Republishing..." : "Confirm Republish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

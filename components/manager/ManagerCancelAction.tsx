"use client"

import { useState, useTransition } from "react"
import { managerCancelEventAction } from "@/actions/events"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function ManagerCancelAction({ eventId }: { eventId: string }) {
  const [isPending, startTransition] = useTransition()
  const [cancelReason, setCancelReason] = useState("")
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)

  function handleCancel() {
    if (!cancelReason.trim() || cancelReason.trim().length < 5) {
      toast.error("A valid cancellation reason of at least 5 characters is required.")
      return
    }

    startTransition(async () => {
      const result = await managerCancelEventAction(eventId, cancelReason)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Event cancelled successfully")
        setIsCancelDialogOpen(false)
      }
    })
  }

  return (
    <div className="w-full">
      <Button 
        variant="destructive" 
        className="w-full" 
        onClick={() => setIsCancelDialogOpen(true)}
        disabled={isPending}
      >
        Cancel Published Event
      </Button>

      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Published Event</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this event? This action will stop all further ticket sales. Existing bookings and payments will not be deleted, but the event will no longer be available to attendees. Please provide a clear reason for cancellation.
            </DialogDescription>
          </DialogHeader>
          <Textarea 
            placeholder="E.g., Event violates terms of service..." 
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            disabled={isPending}
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)} disabled={isPending}>Go Back</Button>
            <Button variant="destructive" onClick={handleCancel} disabled={isPending}>
              {isPending ? "Cancelling..." : "Confirm Cancellation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

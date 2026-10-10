"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { cancelEventAction } from "@/actions/events"
import { toast } from "sonner"

export function CancelEventButton({ eventId }: { eventId: string }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [isPending, startTransition] = useTransition()

  const handleCancel = () => {
    if (reason.trim().length < 5) {
      toast.error("Please provide a valid cancellation reason.")
      return
    }

    startTransition(async () => {
      const res = await cancelEventAction(eventId, reason)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success("Event has been cancelled.")
        setOpen(false)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button size="sm" variant="destructive" className="w-full mt-2" />
      }>
        Cancel Event
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel Event</DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel this event? This action will permanently stop new bookings and may affect attendees who have already purchased tickets.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-2">
          <label className="text-sm font-medium">Cancellation Reason (Required)</label>
          <Textarea 
            placeholder="Please explain why the event is being cancelled..." 
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={isPending}
            className="resize-none"
            rows={3}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Keep Event
          </Button>
          <Button variant="destructive" onClick={handleCancel} disabled={isPending}>
            {isPending ? "Cancelling..." : "Confirm Cancellation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

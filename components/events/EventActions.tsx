"use client"

import { useTransition } from "react"
import { updateEventStatusAction, submitForReviewAction } from "@/actions/events"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function EventActions({ event }: { event: any }) {
  const [isPending, startTransition] = useTransition()
  
  const handleStatusUpdate = (status: "DRAFT" | "CANCELLED") => {
    startTransition(async () => {
      const result = await updateEventStatusAction(event.id, status)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(`Event status updated to ${status}`)
      }
    })
  }

  const handleSubmit = () => {
    startTransition(async () => {
      const result = await submitForReviewAction(event.id)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success("Event submitted for review!")
      }
    })
  }

  const hasSoldTickets = event.ticketTypes.some((t: any) => t.sold > 0)

  return (
    <div className="flex flex-wrap gap-2">
      {(event.status === "DRAFT" || event.status === "REJECTED") && (
        <Button 
          onClick={handleSubmit} 
          disabled={isPending}
        >
          {isPending ? "Submitting..." : "Submit for Approval"}
        </Button>
      )}

      {(event.status === "PENDING_REVIEW" || event.status === "PUBLISHED" || event.status === "REJECTED") && (
        <Button 
          variant="secondary"
          onClick={() => handleStatusUpdate("DRAFT")} 
          disabled={isPending || hasSoldTickets}
        >
          Unpublish to Draft
        </Button>
      )}

      {event.status !== "CANCELLED" && (
        <AlertDialog>
          <AlertDialogTrigger render={<Button variant="destructive" disabled={isPending} />}>
            Cancel Event
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to cancel this event?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. 
                <br /><br />
                <strong>TODO:</strong> Refunds will be handled automatically in a later phase.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Go Back</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleStatusUpdate("CANCELLED")}>
                Yes, Cancel Event
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}

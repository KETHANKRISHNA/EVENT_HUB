"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { approveEventAction, rejectEventAction } from "@/actions/events"
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
  DialogTrigger,
} from "@/components/ui/dialog"

export function EventReviewActions({ eventId }: { eventId: string }) {
  const [isPending, startTransition] = useTransition()
  const [rejectReason, setRejectReason] = useState("")
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const router = useRouter()

  function handleApprove() {
    startTransition(async () => {
      const result = await approveEventAction(eventId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Event approved and published!")
        router.push("/manager")
      }
    })
  }

  function handleReject() {
    if (!rejectReason.trim()) {
      toast.error("Rejection reason is required")
      return
    }

    startTransition(async () => {
      const result = await rejectEventAction(eventId, rejectReason)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Event rejected successfully")
        setIsRejectDialogOpen(false)
        router.push("/manager")
      }
    })
  }

  return (
    <div className="flex gap-4 w-full">
      <Button 
        variant="destructive" 
        className="flex-1" 
        onClick={() => setIsRejectDialogOpen(true)}
        disabled={isPending}
      >
        Reject Event
      </Button>

      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Event Submission</DialogTitle>
            <DialogDescription>
              Please provide a clear reason for rejection. This will be visible to the organizer.
            </DialogDescription>
          </DialogHeader>
          <Textarea 
            placeholder="E.g., The banner image is inappropriate and the description lacks details." 
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            disabled={isPending}
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)} disabled={isPending}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={isPending}>Confirm Rejection</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Button variant="default" className="flex-1 bg-green-600 hover:bg-green-700" onClick={handleApprove} disabled={isPending}>
        {isPending ? "Processing..." : "Approve & Publish"}
      </Button>
    </div>
  )
}

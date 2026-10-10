"use client"

import { useState, useTransition } from "react"
import { submitForReviewAction } from "@/actions/events"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { SendIcon } from "lucide-react"

export function SubmitEventButton({ eventId, fullWidth = false }: { eventId: string, fullWidth?: boolean }) {
  const [isPending, startTransition] = useTransition()

  function handleSubmit() {
    startTransition(async () => {
      const result = await submitForReviewAction(eventId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Event submitted for review!")
      }
    })
  }

  return (
    <Button 
      variant="default" 
      size="sm" 
      onClick={handleSubmit} 
      disabled={isPending}
      className={fullWidth ? "w-full" : ""}
    >
      <SendIcon className="h-4 w-4 mr-2" />
      {isPending ? "Submitting..." : "Submit for Review"}
    </Button>
  )
}

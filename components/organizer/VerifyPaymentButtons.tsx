"use client"

import { useTransition, useState } from "react"
import { Button } from "@/components/ui/button"
import { approvePaymentAction, rejectPaymentAction } from "@/actions/bookings"
import { toast } from "sonner"
import { Check, X } from "lucide-react"

export function VerifyPaymentButtons({ bookingId }: { bookingId: string }) {
  const [isPending, startTransition] = useTransition()
  
  const handleApprove = () => {
    if (!window.confirm("Are you sure you want to verify this payment and generate tickets?")) return
    startTransition(async () => {
      const res = await approvePaymentAction(bookingId)
      if (res.error) toast.error(res.error)
      else toast.success("Payment verified and tickets generated!")
    })
  }

  const handleReject = () => {
    const reason = prompt("Enter rejection reason:")
    if (!reason || reason.trim().length < 2) {
      toast.error("Valid reason is required to reject.")
      return
    }
    
    startTransition(async () => {
      const res = await rejectPaymentAction(bookingId, reason)
      if (res.error) toast.error(res.error)
      else toast.success("Payment rejected.")
    })
  }

  return (
    <div className="flex items-center gap-2 mt-2">
      <Button size="sm" variant="outline" className="h-7 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={handleApprove} disabled={isPending}>
        <Check className="w-3 h-3 mr-1" /> Verify & Confirm
      </Button>
      <Button size="sm" variant="outline" className="h-7 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleReject} disabled={isPending}>
        <X className="w-3 h-3 mr-1" /> Reject Payment
      </Button>
    </div>
  )
}

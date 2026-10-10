"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { TicketIcon, Minus, Plus } from "lucide-react"
import { createBookingAction } from "@/actions/bookings"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"

type TicketType = {
  id: string
  name: string
  pricePaise: number
  quantity: number
  sold: number
}

import type { EventLifecycleState } from "@/lib/utils"

export function EventBookingForm({ eventId, ticketTypes, availableByTicketId, userAuthenticated, lifecycleState, organizerUpi }: { 
  eventId: string, 
  ticketTypes: TicketType[],
  availableByTicketId: Record<string, number>,
  userAuthenticated: boolean,
  lifecycleState: EventLifecycleState,
  organizerUpi?: { upiId: string | null, upiName: string | null, upiQrUrl?: string | null, upiVerified: boolean }
}) {
  const router = useRouter()
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [isPending, startTransition] = useTransition()
  const [showUpiModal, setShowUpiModal] = useState(false)
  const [upiPaymentDetails, setUpiPaymentDetails] = useState<{ amount: number, bookingId: string } | null>(null)
  const [utr, setUtr] = useState("")
  const [isSubmittingUtr, startUtrTransition] = useTransition()
  
  const handleQuantityChange = (ticketId: string, delta: number, maxAvailable: number) => {
    setQuantities(prev => {
      const current = prev[ticketId] || 0
      const next = current + delta
      if (next < 0) return prev
      if (next > maxAvailable) return prev
      if (next > 10) return prev // reasonable max per ticket type per booking
      
      const newQuantities = { ...prev }
      if (next === 0) {
        delete newQuantities[ticketId]
      } else {
        newQuantities[ticketId] = next
      }
      return newQuantities
    })
  }

  const selectedTickets = Object.keys(quantities).map(id => {
    const t = ticketTypes.find(t => t.id === id)!
    return { ...t, selectedQty: quantities[id] }
  })

  const totalPaise = selectedTickets.reduce((acc, t) => acc + (t.pricePaise * t.selectedQty), 0)
  const totalQuantity = selectedTickets.reduce((acc, t) => acc + t.selectedQty, 0)
  
  const handleBook = () => {
    if (!userAuthenticated) {
      toast.error("Please login to book tickets.")
      router.push("/login")
      return
    }

    if (totalPaise > 0) {
      setUpiPaymentDetails({ amount: totalPaise, bookingId: "" })
      setShowUpiModal(true)
      return
    }

    startTransition(async () => {
      const reqTickets = Object.entries(quantities).map(([id, qty]) => ({ ticketTypeId: id, quantity: qty }))
      const res = await createBookingAction({ eventId, tickets: reqTickets })
      
      if ("error" in res && res.error) {
        toast.error(res.error)
        return
      }

      toast.success("Booking confirmed successfully!")
      router.push("/my-bookings")
    })
  }

  const handleSubmitUtr = () => {
    if (!utr || utr.trim().length < 4) {
      toast.error("Please enter a valid UTR or reference number.")
      return
    }
    
    startUtrTransition(async () => {
      const reqTickets = Object.entries(quantities).map(([id, qty]) => ({ ticketTypeId: id, quantity: qty }))
      const res = await createBookingAction({ eventId, tickets: reqTickets, utr })
      
      if ("error" in res && res.error) {
        toast.error(res.error)
        return
      }
      
      toast.success("Payment request submitted. The organizer will verify your payment.")
      setShowUpiModal(false)
      router.push("/my-bookings")
    })
  }

  const isCompletelySoldOut = ticketTypes.every(t => availableByTicketId[t.id] <= 0)
  const isPastUpcoming = lifecycleState !== "UPCOMING"

  return (
    <div className={`border rounded-xl p-6 space-y-6 transition-all ${isPastUpcoming ? 'bg-muted/10 opacity-70 grayscale-[20%]' : 'bg-muted/30'}`}>
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <TicketIcon className="w-5 h-5" /> Tickets
          </h3>
          {lifecycleState === "STARTED" && (
            <span className="bg-amber-500/10 text-amber-600 border-amber-500/20 border px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              Event Started
            </span>
          )}
          {lifecycleState === "ENDED" && (
            <span className="bg-destructive/10 text-destructive border-destructive/20 border px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              Event Ended
            </span>
          )}
        </div>
        
        {ticketTypes.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No tickets available yet.</p>
        ) : (
          <div className="space-y-4">
            {ticketTypes.map(ticket => {
              const available = availableByTicketId[ticket.id] || 0
              const isSoldOut = available <= 0
              const qty = quantities[ticket.id] || 0
              const price = ticket.pricePaise / 100
              
              return (
                <div key={ticket.id} className={`p-4 border rounded-lg ${isSoldOut ? 'opacity-60 bg-muted' : 'bg-background'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold">{ticket.name}</p>
                      <p className="text-muted-foreground text-sm">
                        {ticket.pricePaise === 0 ? "Free" : `₹${price.toFixed(0)}`}
                      </p>
                    </div>
                    {isSoldOut ? (
                      <span className="text-destructive font-medium text-sm border border-destructive/20 bg-destructive/10 px-2 py-1 rounded">SOLD OUT</span>
                    ) : isPastUpcoming ? (
                      <span className="text-muted-foreground font-medium text-sm border bg-muted px-2 py-1 rounded">UNAVAILABLE</span>
                    ) : (
                      <div className="flex items-center gap-3">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8" 
                          onClick={() => handleQuantityChange(ticket.id, -1, available)}
                          disabled={qty === 0 || isPending}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-4 text-center font-medium">{qty}</span>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8" 
                          onClick={() => handleQuantityChange(ticket.id, 1, available)}
                          disabled={qty >= available || qty >= 10 || isPending}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  {!isSoldOut && (
                    <p className="text-xs text-muted-foreground">Available: {available}</p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {totalQuantity > 0 && (
        <div className="p-4 bg-background border rounded-lg space-y-3">
          <h4 className="font-semibold text-sm uppercase text-muted-foreground">Booking Summary</h4>
          <div className="space-y-2 text-sm">
            {selectedTickets.map(t => (
              <div key={t.id} className="flex justify-between items-center">
                <span>{t.selectedQty}x {t.name}</span>
                <span className="font-medium">₹{(t.pricePaise / 100) * t.selectedQty}</span>
              </div>
            ))}
            <div className="border-t pt-2 mt-2 flex justify-between items-center font-bold text-base">
              <span>Total Payable</span>
              <span>₹{totalPaise / 100}</span>
            </div>
          </div>
        </div>
      )}

      {totalQuantity > 0 && totalPaise > 0 && (!organizerUpi?.upiId) && (
        <div className="space-y-3 pt-2">
          <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 p-2 rounded">
            The organizer has not configured a payment method yet. You cannot book paid tickets for this event.
          </p>
        </div>
      )}

      <Button 
        className="w-full mt-4" 
        size="lg" 
        disabled={isCompletelySoldOut || ticketTypes.length === 0 || totalQuantity === 0 || isPending || isPastUpcoming || (totalPaise > 0 && !organizerUpi?.upiId)}
        onClick={handleBook}
      >
        {isPending ? "Processing..." : isPastUpcoming ? (lifecycleState === "STARTED" ? "Event Started" : "Event Ended") : (isCompletelySoldOut ? "Sold Out" : "Book Tickets")}
      </Button>

      <Dialog open={showUpiModal} onOpenChange={(open) => !open && setShowUpiModal(false)}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pay via UPI</DialogTitle>
            <DialogDescription>
              Scan the QR code with any UPI app (GPay, PhonePe, Paytm, etc.) to complete your booking.
            </DialogDescription>
          </DialogHeader>
          
          {upiPaymentDetails && organizerUpi?.upiId && (
            <div className="flex flex-col items-center justify-center space-y-4 py-4">
              <div className="bg-white p-4 rounded-xl border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={organizerUpi.upiQrUrl || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=${organizerUpi.upiId}&pn=${organizerUpi.upiName || "EventHub Organizer"}&am=${upiPaymentDetails.amount / 100}&cu=INR`)}`} 
                  alt="UPI QR Code" 
                  className="w-48 h-48 object-contain"
                />
              </div>
              <div className="text-center space-y-1">
                <p className="font-semibold text-xl">₹{(upiPaymentDetails.amount / 100).toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Paying: {organizerUpi.upiName || organizerUpi.upiId}</p>
                <p className="text-xs text-muted-foreground font-mono">
                  {organizerUpi.upiId} 
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="ml-2 h-6" 
                    onClick={() => {
                      navigator.clipboard.writeText(organizerUpi.upiId!)
                      toast.success("UPI ID copied!")
                    }}
                  >
                    Copy
                  </Button>
                </p>
              </div>
              
              <div className="w-full space-y-2 mt-4 text-left">
                <label className="text-sm font-semibold">Enter UTR / Reference No (12 Digits usually)</label>
                <input 
                  type="text" 
                  className="w-full border rounded p-2 text-sm" 
                  placeholder="e.g. 312345678901" 
                  value={utr}
                  onChange={e => setUtr(e.target.value)}
                />
              </div>

              <div className="w-full bg-amber-50 text-amber-800 p-3 rounded-md text-xs border border-amber-200 mt-2">
                <strong>Important:</strong> After successful payment from any UPI app, enter the UTR above. Submitting a UTR does not automatically confirm payment; the organizer must verify it.
              </div>
              
              <Button onClick={handleSubmitUtr} disabled={isSubmittingUtr || utr.length < 4} className="w-full mt-4" size="lg">
                {isSubmittingUtr ? "Submitting..." : "Submit Payment Request"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}


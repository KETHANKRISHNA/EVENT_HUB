"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import crypto from "crypto"
import { revalidatePath } from "next/cache"
import { getEventLifecycleState } from "@/lib/utils"

const bookTicketsSchema = z.object({
  eventId: z.string(),
  tickets: z.array(z.object({
    ticketTypeId: z.string(),
    quantity: z.number().int().positive()
  })).min(1, "Select at least one ticket type"),
  utr: z.string().optional()
})

export async function createBookingAction(data: z.infer<typeof bookTicketsSchema>) {
  const session = await auth()
  if (!session || !session.user) return { error: "Unauthorized" }

  const parsed = bookTicketsSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Invalid booking data" }

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { phone: true } })
  if (!user?.phone) {
    return { error: "A valid phone number is required in your profile to book tickets." }
  }
  const { eventId, tickets, utr } = parsed.data

  const event = await prisma.event.findUnique({
    where: { id: eventId, status: "PUBLISHED" },
    include: { ticketTypes: true }
  })
  if (!event) return { error: "Event not found or not published" }
  if (event.status === "CANCELLED") return { error: "Cannot book tickets. Event is cancelled." }

  const lifecycleState = getEventLifecycleState(new Date(event.startsAt), new Date(event.endsAt))
  if (lifecycleState !== "UPCOMING") {
    return { error: `Cannot book tickets. Event has already ${lifecycleState === "STARTED" ? "started" : "ended"}.` }
  }

  try {
    return await prisma.$transaction(async (tx) => {
      let totalPaise = 0
      const seatHoldsToCreate = []

      for (const req of tickets) {
        const dbTicket = event.ticketTypes.find(t => t.id === req.ticketTypeId)
        if (!dbTicket) throw new Error(`Invalid ticket type: ${req.ticketTypeId}`)

        totalPaise += dbTicket.pricePaise * req.quantity
      }

      if (totalPaise > 0) {
        if (!utr || utr.trim().length < 4) {
          throw new Error("A valid UTR or reference number is required to book paid tickets.")
        }
        
        const existingPayment = await tx.payment.findFirst({
          where: { utr: utr.trim(), status: { notIn: ["REJECTED", "FAILED"] } }
        })

        if (existingPayment) {
          throw new Error("This UTR has already been submitted for another booking.")
        }
      }

      for (const req of tickets) {
        const dbTicket = event.ticketTypes.find(t => t.id === req.ticketTypeId)!
        
        const activeHolds = await tx.seatHold.aggregate({
          where: {
            ticketTypeId: dbTicket.id,
            expiresAt: { gt: new Date() }
          },
          _sum: { quantity: true }
        })
        const holdsQuantity = activeHolds._sum.quantity || 0
        const available = dbTicket.quantity - dbTicket.sold - holdsQuantity

        if (available < req.quantity) {
          throw new Error(`Only ${available} tickets available for ${dbTicket.name}`)
        }

        seatHoldsToCreate.push({
          userId: session.user.id!,
          eventId: event.id,
          ticketTypeId: dbTicket.id,
          quantity: req.quantity,
          seatIds: [],
          expiresAt: new Date(new Date().getTime() + (totalPaise > 0 ? 48 * 60 * 60 * 1000 : 15 * 60 * 1000))
        })
      }

      const booking = await tx.booking.create({
        data: {
          userId: session.user.id!,
          eventId: event.id,
          totalPaise,
          status: totalPaise > 0 ? "PAYMENT_REVIEW" : "CONFIRMED",
          items: {
            create: tickets.map(req => {
              const dbTicket = event.ticketTypes.find(t => t.id === req.ticketTypeId)!
              return {
                ticketTypeId: req.ticketTypeId,
                quantity: req.quantity,
                pricePaise: dbTicket.pricePaise
              }
            })
          }
        }
      })

      await tx.seatHold.createMany({ 
        data: seatHoldsToCreate.map(hold => ({ ...hold, bookingId: booking.id }))
      })

      if (totalPaise > 0) {
        await tx.payment.create({
          data: {
            bookingId: booking.id,
            status: "PAYMENT_REVIEW",
            amountPaise: totalPaise,
            utr: utr!.trim()
          }
        })
      } else {
        // Free ticket - generate immediately
        for (const hold of seatHoldsToCreate) {
          await tx.ticketType.update({
            where: { id: hold.ticketTypeId },
            data: { sold: { increment: hold.quantity } }
          })
          for (let i = 0; i < hold.quantity; i++) {
            await tx.ticket.create({
              data: {
                bookingId: booking.id,
                ticketTypeId: hold.ticketTypeId,
                qrToken: crypto.randomBytes(16).toString("hex"),
                status: "VALID"
              }
            })
          }
        }
      }

      return { 
        success: true, 
        bookingId: booking.id, 
        amount: totalPaise 
      }
    }, { maxWait: 5000, timeout: 10000 })
  } catch (error: any) {
    return { error: error.message || "Failed to create booking" }
  }
}

export async function submitUtrAction(bookingId: string, utr: string) {
  const session = await auth()
  if (!session) return { error: "Unauthorized" }
  
  if (!utr || utr.trim().length < 4) {
    return { error: "Please enter a valid UTR or reference number" }
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId, userId: session.user.id! }
    })
    
    if (!booking || booking.status !== "PENDING") {
      return { error: "Invalid booking or payment already submitted." }
    }

    const existingPayment = await prisma.payment.findFirst({
      where: { utr: utr.trim(), status: { notIn: ["REJECTED", "FAILED"] } }
    })

    if (existingPayment && existingPayment.bookingId !== bookingId) {
      return { error: "This UTR has already been submitted for another booking." }
    }

    await prisma.$transaction(async (tx) => {
      const activeHolds = await tx.seatHold.count({
        where: { 
          userId: session.user.id, 
          eventId: booking.eventId, 
          expiresAt: { gt: new Date() } 
        }
      })

      if (activeHolds === 0) {
        throw new Error("Your ticket reservation has expired (15 minute limit exceeded). Please return to the event page and make a new booking.")
      }

      await tx.payment.updateMany({
        where: { bookingId },
        data: {
          utr: utr.trim(),
          status: "PAYMENT_REVIEW"
        }
      })
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: "PAYMENT_REVIEW" }
      })
      // Extend seat hold for 48 hours to allow organizer review
      await tx.seatHold.updateMany({
        where: { userId: session.user.id, eventId: booking.eventId },
        data: {
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000)
        }
      })
    })

    revalidatePath("/my-bookings")
    return { success: true }
  } catch (error: any) {
    return { error: "Failed to submit UTR." }
  }
}

export async function approvePaymentAction(bookingId: string) {
  const session = await auth()
  if (!session || session.user.role !== "ORGANIZER") return { error: "Unauthorized" }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { event: true, items: true }
      })
      
      if (!booking || booking.event.organizerId !== session.user.id) {
        throw new Error("Unauthorized or invalid booking.")
      }
      if (booking.status !== "PAYMENT_REVIEW") {
        throw new Error("Booking is not pending review.")
      }

      await tx.payment.updateMany({
        where: { bookingId },
        data: { status: "CONFIRMED" }
      })

      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: { status: "CONFIRMED" }
      })

      // Generate tickets based on the authoritative BookingItem records
      for (const item of booking.items) {
        await tx.ticketType.update({
          where: { id: item.ticketTypeId },
          data: { sold: { increment: item.quantity } }
        })

        for (let i = 0; i < item.quantity; i++) {
          await tx.ticket.create({
            data: {
              bookingId: booking.id,
              ticketTypeId: item.ticketTypeId,
              qrToken: crypto.randomBytes(16).toString("hex"),
              status: "VALID"
            }
          })
        }
      }

      // Explicitly delete holds for this booking now that tickets are generated
      await tx.seatHold.deleteMany({
        where: { bookingId: booking.id }
      })

      return updatedBooking
    })
    
    revalidatePath(`/organizer`)
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Failed to approve payment." }
  }
}

export async function rejectPaymentAction(bookingId: string, reason: string) {
  const session = await auth()
  if (!session || session.user.role !== "ORGANIZER") return { error: "Unauthorized" }

  if (!reason || reason.trim().length < 2) {
    return { error: "Rejection reason is required." }
  }

  try {
    await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { event: true }
      })
      
      if (!booking || booking.event.organizerId !== session.user.id) {
        throw new Error("Unauthorized or invalid booking.")
      }
      if (booking.status !== "PAYMENT_REVIEW") {
        throw new Error("Booking is not pending review.")
      }

      await tx.payment.updateMany({
        where: { bookingId },
        data: { status: "REJECTED", rejectionReason: reason }
      })

      await tx.booking.update({
        where: { id: bookingId },
        data: { status: "REJECTED" }
      })
      
      // Optionally release holds if any remain (they normally expire on their own, but we can clean them up now)
      await tx.seatHold.deleteMany({
        where: { bookingId: booking.id }
      })
    })
    
    revalidatePath(`/organizer`)
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Failed to reject payment." }
  }
}

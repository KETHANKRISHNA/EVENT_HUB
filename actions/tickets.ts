"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { revalidatePath } from "next/cache"

import { manageTicketTypeSchema, seatLayoutSchema } from "@/lib/schemas"

export async function createTicketTypeAction(eventId: string, data: z.infer<typeof manageTicketTypeSchema>) {
  const session = await auth()
  if (!session || (session.user.role !== "ORGANIZER" && session.user.role !== "MANAGER")) {
    return { error: "Unauthorized" }
  }

  const parsed = manageTicketTypeSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Invalid ticket data" }

  const event = await prisma.event.findUnique({ where: { id: eventId } })
  if (!event || (event.organizerId !== session.user.id && session.user.role !== "MANAGER")) {
    return { error: "Forbidden" }
  }

  try {
    await prisma.ticketType.create({
      data: {
        eventId,
        name: parsed.data.name,
        pricePaise: Math.round(parsed.data.priceRupees * 100),
        quantity: parsed.data.quantity,
        saleStart: parsed.data.saleStart,
        saleEnd: parsed.data.saleEnd,
      }
    })
    revalidatePath(`/organizer/events/${eventId}/tickets`)
    return { success: true }
  } catch (error) {
    return { error: "Failed to create ticket type" }
  }
}

export async function updateTicketTypeAction(eventId: string, id: string, data: z.infer<typeof manageTicketTypeSchema>) {
  const session = await auth()
  if (!session || (session.user.role !== "ORGANIZER" && session.user.role !== "MANAGER")) {
    return { error: "Unauthorized" }
  }

  const parsed = manageTicketTypeSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Invalid ticket data" }

  const event = await prisma.event.findUnique({ where: { id: eventId } })
  if (!event || (event.organizerId !== session.user.id && session.user.role !== "MANAGER")) {
    return { error: "Forbidden" }
  }

  const ticketType = await prisma.ticketType.findUnique({ where: { id } })
  if (!ticketType || ticketType.eventId !== eventId) return { error: "Not found" }

  if (parsed.data.quantity < ticketType.sold) {
    return { error: `Cannot reduce quantity below sold amount (${ticketType.sold})` }
  }

  try {
    await prisma.ticketType.update({
      where: { id },
      data: {
        name: parsed.data.name,
        pricePaise: Math.round(parsed.data.priceRupees * 100),
        quantity: parsed.data.quantity,
        saleStart: parsed.data.saleStart,
        saleEnd: parsed.data.saleEnd,
      }
    })
    revalidatePath(`/organizer/events/${eventId}/tickets`)
    return { success: true }
  } catch (error) {
    return { error: "Failed to update ticket type" }
  }
}

export async function deleteTicketTypeAction(eventId: string, id: string) {
  const session = await auth()
  if (!session || (session.user.role !== "ORGANIZER" && session.user.role !== "MANAGER")) {
    return { error: "Unauthorized" }
  }

  const event = await prisma.event.findUnique({ where: { id: eventId } })
  if (!event || (event.organizerId !== session.user.id && session.user.role !== "MANAGER")) {
    return { error: "Forbidden" }
  }

  const ticketType = await prisma.ticketType.findUnique({ where: { id } })
  if (!ticketType || ticketType.eventId !== eventId) return { error: "Not found" }

  if (ticketType.sold > 0) {
    return { error: "Cannot delete ticket type that has sold tickets" }
  }

  try {
    await prisma.ticketType.delete({ where: { id } })
    revalidatePath(`/organizer/events/${eventId}/tickets`)
    return { success: true }
  } catch (error) {
    return { error: "Failed to delete ticket type" }
  }
}

// seatLayoutSchema moved to lib/schemas.ts

export async function generateSeatLayoutAction(eventId: string, data: z.infer<typeof seatLayoutSchema>) {
  const session = await auth()
  if (!session || (session.user.role !== "ORGANIZER" && session.user.role !== "MANAGER")) {
    return { error: "Unauthorized" }
  }

  const parsed = seatLayoutSchema.safeParse(data)
  if (!parsed.success) return { error: "Invalid seat layout configuration" }

  const event = await prisma.event.findUnique({ where: { id: eventId }, include: { seats: true, ticketTypes: true } })
  if (!event || (event.organizerId !== session.user.id && session.user.role !== "MANAGER")) {
    return { error: "Forbidden" }
  }

  if (!event.hasSeating) return { error: "Event does not have seating enabled" }

  const hasBookedOrHeld = event.seats.some(s => s.status !== "AVAILABLE")
  if (hasBookedOrHeld) {
    return { error: "Cannot regenerate layout because some seats are already held or booked" }
  }

  try {
    // Transaction: delete old seats, create new ones, update ticket type quantities
    await prisma.$transaction(async (tx) => {
      await tx.seat.deleteMany({ where: { eventId } })

      const seatsToCreate = []
      const ticketTypeCounts: Record<string, number> = {}

      for (let r = 1; r <= parsed.data.rows; r++) {
        // Find mapping for this row
        const mapping = parsed.data.mappings.find(m => r >= m.startRow && r <= m.endRow)
        if (!mapping) throw new Error(`Row ${r} is not assigned to any ticket type`)

        const rowLetter = String.fromCharCode(64 + r) // 1=A, 2=B...
        
        for (let s = 1; s <= parsed.data.seatsPerRow; s++) {
          seatsToCreate.push({
            eventId,
            ticketTypeId: mapping.ticketTypeId,
            row: rowLetter,
            number: s,
            label: `${rowLetter}${s}`,
            status: "AVAILABLE" as const
          })
        }
        
        ticketTypeCounts[mapping.ticketTypeId] = (ticketTypeCounts[mapping.ticketTypeId] || 0) + parsed.data.seatsPerRow
      }

      await tx.seat.createMany({ data: seatsToCreate })

      // Update ticket quantities to match exactly the generated seats
      for (const [ttId, count] of Object.entries(ticketTypeCounts)) {
        await tx.ticketType.update({
          where: { id: ttId },
          data: { quantity: count }
        })
      }
    })

    revalidatePath(`/organizer/events/${eventId}/tickets`)
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Failed to generate seat layout" }
  }
}

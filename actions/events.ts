"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import { createClient } from "@supabase/supabase-js"

import { eventSchema } from "@/lib/schemas"

export async function uploadBannerAction(formData: FormData) {
  const session = await auth()
  if (!session || session.user.role !== "ORGANIZER") {
    return { error: "Unauthorized" }
  }

  const file = formData.get("file") as File
  if (!file) return { error: "No file provided" }
  
  if (file.size > 3 * 1024 * 1024) return { error: "File exceeds 3 MB limit" }
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return { error: "Invalid file type. Only JPG, PNG, WEBP allowed." }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.warn("Supabase credentials missing, mocking upload.")
    return { url: "https://via.placeholder.com/800x400?text=Event+Banner" }
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  
  const ext = file.name.split('.').pop()
  const filename = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`
  
  const { data, error } = await supabase.storage
    .from("event-banners")
    .upload(filename, file, { contentType: file.type })

  if (error) return { error: error.message }
  
  const { data: publicUrlData } = supabase.storage
    .from("event-banners")
    .getPublicUrl(filename)

  return { url: publicUrlData.publicUrl }
}

export async function createEventAction(data: z.infer<typeof eventSchema>) {
  const session = await auth()
  if (!session || session.user.role !== "ORGANIZER") {
    return { error: "Unauthorized" }
  }

  const parsed = eventSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Invalid event data" }

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { phone: true } })
  if (!user?.phone) {
    return { error: "A valid phone number is required in your profile to create events." }
  }

  const { tickets, ...eventData } = parsed.data;

  try {
    const event = await prisma.event.create({
      data: {
        ...eventData,
        organizerId: session.user.id,
        status: "DRAFT",
        ticketTypes: {
          create: tickets.map(t => ({
            name: t.name,
            pricePaise: Math.round(t.price * 100),
            quantity: t.quantity,
            saleStart: new Date(),
            saleEnd: eventData.startsAt,
          }))
        }
      }
    })
    revalidatePath("/organizer")
    return { success: true, eventId: event.id }
  } catch (error) {
    console.error("CREATE EVENT ERROR:", error)
    return { error: "Failed to create event" }
  }
}

export async function updateEventAction(id: string, data: z.infer<typeof eventSchema>) {
  const session = await auth()
  if (!session || session.user.role !== "ORGANIZER") {
    return { error: "Unauthorized" }
  }

  const parsed = eventSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Invalid event data" }

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { phone: true } })
  if (!user?.phone) {
    return { error: "A valid phone number is required in your profile to update events." }
  }

  const event = await prisma.event.findUnique({
    where: { id },
    include: { ticketTypes: true }
  })
  
  if (!event) return { error: "Event not found" }
  
  if (event.organizerId !== session.user.id) {
    return { error: "Forbidden" }
  }

  if (event.status === "PENDING_REVIEW") {
     return { error: "Cannot edit an event while it is under review." }
  }

  const hasSoldTickets = event.ticketTypes.some(t => t.sold > 0)
  const { tickets, ...eventData } = parsed.data;
  
  if (hasSoldTickets) {
    if (eventData.startsAt.getTime() !== event.startsAt.getTime() ||
        eventData.endsAt.getTime() !== event.endsAt.getTime()) {
      return { error: "Cannot change dates after tickets are sold" }
    }
    if (eventData.hasSeating !== event.hasSeating) {
      return { error: "Cannot change seating mode after tickets are sold" }
    }
  }

  try {
    const newStatus = event.status === "PUBLISHED" ? "PENDING_REVIEW" : event.status;

    await prisma.$transaction(async (tx) => {
      await tx.event.update({
        where: { id },
        data: {
          ...eventData,
          status: newStatus
        }
      });

      // Simple ticket update: since this is just the basic setup, we'll only update or add new tickets.
      // If a ticket type was removed but had sold items, it's unsafe. For simplicity, we just upsert based on name if id is missing, or update by id.
      // Wait, deleting ticket types can be problematic if seats/bookings exist.
      // A better approach is to handle each ticket type:
      for (const t of tickets) {
        if (t.id) {
          // Verify we aren't lowering quantity below sold
          const existing = event.ticketTypes.find(et => et.id === t.id);
          if (existing && t.quantity < existing.sold) {
            throw new Error(`Cannot reduce quantity below sold tickets for ${t.name}`);
          }
          await tx.ticketType.update({
            where: { id: t.id },
            data: {
              name: t.name,
              pricePaise: Math.round(t.price * 100),
              quantity: t.quantity,
            }
          });
        } else {
          await tx.ticketType.create({
            data: {
              eventId: id,
              name: t.name,
              pricePaise: Math.round(t.price * 100),
              quantity: t.quantity,
              saleStart: new Date(),
              saleEnd: eventData.startsAt,
            }
          });
        }
      }
    });

    revalidatePath("/organizer")
    revalidatePath(`/organizer/events/${id}/edit`)
    return { success: true, status: newStatus }
  } catch (error: any) {
    return { error: error.message || "Failed to update event" }
  }
}

export async function submitForReviewAction(id: string) {
  const session = await auth()
  if (!session || session.user.role !== "ORGANIZER") {
    return { error: "Unauthorized" }
  }

  const event = await prisma.event.findUnique({
    where: { id }
  })

  if (!event) return { error: "Event not found" }
  if (event.organizerId !== session.user.id) return { error: "Forbidden" }
  if (event.status !== "DRAFT" && event.status !== "REJECTED") {
    return { error: "Event must be in DRAFT or REJECTED status to submit" }
  }

  try {
    await prisma.event.update({
      where: { id },
      data: { 
        status: "PENDING_REVIEW",
        rejectionReason: null 
      }
    })
    revalidatePath("/organizer")
    return { success: true }
  } catch (error) {
    return { error: "Failed to submit event" }
  }
}

export async function approveEventAction(id: string) {
  const session = await auth()
  if (!session || session.user.role !== "MANAGER") {
    return { error: "Unauthorized" }
  }

  try {
    await prisma.event.update({
      where: { id },
      data: { 
        status: "PUBLISHED",
        approvedBy: session.user.id,
        approvedAt: new Date()
      }
    })
    revalidatePath("/manager")
    return { success: true }
  } catch (error) {
    return { error: "Failed to approve event" }
  }
}

export async function rejectEventAction(id: string, reason: string) {
  const session = await auth()
  if (!session || session.user.role !== "MANAGER") {
    return { error: "Unauthorized" }
  }

  if (!reason || reason.trim().length === 0) {
    return { error: "Rejection reason is required" }
  }

  try {
    await prisma.event.update({
      where: { id },
      data: { 
        status: "REJECTED",
        rejectedBy: session.user.id,
        rejectedAt: new Date(),
        rejectionReason: reason
      }
    })
    revalidatePath("/manager")
    return { success: true }
  } catch (error) {
    return { error: "Failed to reject event" }
  }
}

export async function updateEventStatusAction(id: string, status: "DRAFT" | "CANCELLED") {
  const session = await auth()
  if (!session || session.user.role !== "ORGANIZER") {
    return { error: "Unauthorized" }
  }

  const event = await prisma.event.findUnique({
    where: { id },
    include: { ticketTypes: true }
  })
  
  if (!event) return { error: "Event not found" }
  if (event.organizerId !== session.user.id) {
    return { error: "Forbidden" }
  }

  if (status === "DRAFT") {
    const hasSoldTickets = event.ticketTypes.some(t => t.sold > 0)
    if (hasSoldTickets) {
      return { error: "Cannot unpublish event with sold tickets" }
    }
  }

  try {
    await prisma.event.update({
      where: { id },
      data: { status }
    })
    revalidatePath("/organizer")
    return { success: true }
  } catch (error) {
    return { error: "Failed to update status" }
  }
}

export async function cancelEventAction(id: string, reason: string) {
  const session = await auth()
  if (!session || session.user.role !== "ORGANIZER") {
    return { error: "Unauthorized" }
  }

  if (!reason || reason.trim().length < 5) {
    return { error: "A valid cancellation reason of at least 5 characters is required." }
  }

  const event = await prisma.event.findUnique({
    where: { id },
  })
  
  if (!event) return { error: "Event not found" }
  if (event.organizerId !== session.user.id) {
    return { error: "Forbidden. You cannot cancel someone else's event." }
  }
  if (event.status === "CANCELLED") {
    return { error: "Event is already cancelled." }
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.event.update({
        where: { id },
        data: { 
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancellationReason: reason.trim()
        }
      })
      
      // Clean up seat holds to release tickets
      await tx.seatHold.deleteMany({
        where: { eventId: id }
      })
    })

    revalidatePath("/organizer")
    revalidatePath(`/events/${id}`)
    revalidatePath("/events")
    return { success: true }
  } catch (error) {
    return { error: "Failed to cancel event" }
  }
}

export async function managerCancelEventAction(id: string, reason: string) {
  const session = await auth()
  if (!session || session.user.role !== "MANAGER") {
    return { error: "Unauthorized" }
  }

  if (!reason || reason.trim().length < 5) {
    return { error: "A valid cancellation reason of at least 5 characters is required." }
  }

  const event = await prisma.event.findUnique({
    where: { id },
  })
  
  if (!event) return { error: "Event not found" }
  if (event.status !== "PUBLISHED") {
    return { error: "Only PUBLISHED events can be cancelled by managers." }
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Recheck status in transaction
      const currentEvent = await tx.event.findUnique({
        where: { id }
      })
      
      if (currentEvent?.status !== "PUBLISHED") {
        throw new Error("Event is no longer PUBLISHED.")
      }

      await tx.event.update({
        where: { id },
        data: { 
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancellationReason: reason.trim()
        }
      })
      
      // Clean up seat holds to release tickets
      await tx.seatHold.deleteMany({
        where: { eventId: id }
      })
    })

    revalidatePath("/manager")
    revalidatePath(`/manager/events/${id}`)
    revalidatePath(`/events/${id}`)
    revalidatePath("/events")
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Failed to cancel event" }
  }
}

export async function managerDeleteEventAction(id: string) {
  const session = await auth()
  if (!session || session.user.role !== "MANAGER") {
    return { error: "Unauthorized" }
  }

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      bookings: true,
      ticketTypes: {
        include: { tickets: true }
      }
    }
  })
  
  if (!event) return { error: "Event not found" }
  
  // Prevent deletion if there are bookings or tickets generated
  if (event.bookings.length > 0) {
    return { error: "Cannot delete event: Dependent booking records exist." }
  }
  
  const hasGeneratedTickets = event.ticketTypes.some(t => t.tickets.length > 0)
  if (hasGeneratedTickets) {
    return { error: "Cannot delete event: Tickets have already been generated." }
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.seatHold.deleteMany({ where: { eventId: id } })
      await tx.ticketType.deleteMany({ where: { eventId: id } })
      await tx.event.delete({ where: { id } })
    })

    revalidatePath("/manager")
    revalidatePath("/events")
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Failed to delete event" }
  }
}

export async function managerRepublishEventAction(id: string) {
  const session = await auth()
  if (!session || session.user.role !== "MANAGER") {
    return { error: "Unauthorized" }
  }

  const event = await prisma.event.findUnique({
    where: { id },
    include: { ticketTypes: true }
  })
  
  if (!event) return { error: "Event not found" }
  
  if (event.status !== "CANCELLED") {
    return { error: "Only CANCELLED events can be republished." }
  }

  if (new Date(event.endsAt) <= new Date()) {
    return { error: "Cannot republish an event that has already ended." }
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Recheck status in transaction
      const currentEvent = await tx.event.findUnique({
        where: { id }
      })
      
      if (currentEvent?.status !== "CANCELLED") {
        throw new Error("Event is no longer CANCELLED.")
      }

      await tx.event.update({
        where: { id },
        data: { 
          status: "PUBLISHED",
          // We intentionally do not clear cancelledAt or cancellationReason 
          // to preserve the audit history of the cancellation.
        }
      })
    })

    revalidatePath("/manager")
    revalidatePath(`/manager/events/${id}`)
    revalidatePath(`/events/${id}`)
    revalidatePath("/events")
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Failed to republish event" }
  }
}

import 'dotenv/config'
import { prisma } from './lib/prisma'

async function main() {
  console.log("Starting reconciliation of Bookings to BookingItems...")
  
  const bookingsWithoutItems = await prisma.booking.findMany({
    where: {
      items: { none: {} }
    },
    include: {
      tickets: true
    }
  })

  console.log(`Found ${bookingsWithoutItems.length} bookings without BookingItems.`)

  let reconstructedCount = 0
  let failedCount = 0

  for (const booking of bookingsWithoutItems) {
    if (booking.tickets.length > 0) {
      // If tickets are already generated, we can faithfully reconstruct BookingItems from them!
      const ticketCounts = booking.tickets.reduce((acc, t) => {
        acc[t.ticketTypeId] = (acc[t.ticketTypeId] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      let totalCalculatedPaise = 0
      const itemsToCreate = []

      for (const [ticketTypeId, qty] of Object.entries(ticketCounts)) {
        const ticketType = await prisma.ticketType.findUnique({ where: { id: ticketTypeId } })
        if (ticketType) {
          itemsToCreate.push({
            ticketTypeId,
            quantity: qty,
            pricePaise: ticketType.pricePaise
          })
          totalCalculatedPaise += ticketType.pricePaise * qty
        }
      }

      // Check if reconstructed total matches the booking's total
      if (totalCalculatedPaise === booking.totalPaise) {
        // Safe to reconstruct
        await prisma.bookingItem.createMany({
          data: itemsToCreate.map(item => ({ ...item, bookingId: booking.id }))
        })
        reconstructedCount++
        console.log(`Reconstructed items for Booking ${booking.id} (CONFIRMED)`)
      } else {
        // The booking total is INCORRECT (this is the 4x premium for ₹1 bug)
        console.log(`WARNING: Booking ${booking.id} total (₹${booking.totalPaise / 100}) does not match tickets generated (₹${totalCalculatedPaise / 100}). Leaving for manual correction.`)
        failedCount++
      }
    } else if (booking.status === "PAYMENT_REVIEW" || booking.status === "PENDING") {
      // For pending/review bookings, try to reconstruct from SeatHold
      const holds = await prisma.seatHold.findMany({
        where: { userId: booking.userId, eventId: booking.eventId }
      })

      if (holds.length > 0) {
        let totalCalculatedPaise = 0
        const itemsToCreate = []

        for (const hold of holds) {
          const ticketType = await prisma.ticketType.findUnique({ where: { id: hold.ticketTypeId } })
          if (ticketType) {
            itemsToCreate.push({
              ticketTypeId: hold.ticketTypeId,
              quantity: hold.quantity,
              pricePaise: ticketType.pricePaise
            })
            totalCalculatedPaise += ticketType.pricePaise * hold.quantity
          }
        }

        if (totalCalculatedPaise === booking.totalPaise) {
          await prisma.bookingItem.createMany({
            data: itemsToCreate.map(item => ({ ...item, bookingId: booking.id }))
          })
          
          // Also link the seat holds to the booking
          for (const hold of holds) {
             await prisma.seatHold.update({
               where: { id: hold.id },
               data: { bookingId: booking.id }
             })
          }
          
          reconstructedCount++
          console.log(`Reconstructed items for Booking ${booking.id} (${booking.status}) from SeatHolds`)
        } else {
          console.log(`WARNING: Booking ${booking.id} total (₹${booking.totalPaise / 100}) does not match SeatHolds (₹${totalCalculatedPaise / 100}). Leaving for manual correction.`)
          failedCount++
        }
      } else {
        console.log(`WARNING: Booking ${booking.id} is ${booking.status} but has no SeatHolds. Cannot reconstruct.`)
        failedCount++
      }
    } else {
      console.log(`WARNING: Booking ${booking.id} is ${booking.status} with no tickets.`)
      failedCount++
    }
  }

  console.log(`Reconciliation complete. Reconstructed: ${reconstructedCount}. Failed/Manual: ${failedCount}.`)
}

main().catch(console.error).finally(() => prisma.$disconnect())

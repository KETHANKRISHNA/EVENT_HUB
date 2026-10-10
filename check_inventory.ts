import 'dotenv/config'
import { prisma } from './lib/prisma'

async function main() {
  console.log("Checking inventory...")
  const ticketTypes = await prisma.ticketType.findMany({
    include: {
      tickets: true,
      event: true
    }
  })

  let fixed = 0;
  for (const tt of ticketTypes) {
    const actualSold = tt.tickets.filter(t => t.status === "VALID").length;
    
    if (tt.sold !== actualSold) {
      console.log(`Discrepancy found for TicketType ${tt.name} (ID: ${tt.id}) in Event ${tt.event.title}:`)
      console.log(`- DB sold counter: ${tt.sold}`)
      console.log(`- Actual VALID tickets: ${actualSold}`)
      
      await prisma.ticketType.update({
        where: { id: tt.id },
        data: { sold: actualSold }
      })
      console.log(`Fixed TicketType ${tt.id} sold counter to ${actualSold}.`)
      fixed++
    }
  }

  const oldPendingBookings = await prisma.booking.findMany({
    where: { status: "PENDING" }
  })
  
  if (oldPendingBookings.length > 0) {
    console.log(`Found ${oldPendingBookings.length} obsolete PENDING bookings. Marking as CANCELLED.`)
    await prisma.booking.updateMany({
      where: { status: "PENDING" },
      data: { status: "CANCELLED" }
    })
  }

  console.log(`Inventory check complete. Fixed ${fixed} ticket types.`)
}

main().catch(console.error).finally(() => prisma.$disconnect())

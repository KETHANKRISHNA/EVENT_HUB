import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import { TicketTypesManager } from "@/components/tickets/TicketTypesManager"
import { SeatLayoutGenerator } from "@/components/tickets/SeatLayoutGenerator"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"

export default async function TicketsPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await auth()
  if (!session) {
    redirect("/login")
  }
  if (session.user.role !== "ORGANIZER") {
    redirect("/")
  }

  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: { 
      ticketTypes: {
        orderBy: { pricePaise: 'asc' }
      },
      seats: true
    }
  })

  if (!event) notFound()

  if (event.organizerId !== session.user.id) {
    redirect("/organizer")
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-5xl space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" render={<Link href="/organizer" />} nativeButton={false}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Tickets</h1>
          <p className="text-muted-foreground mt-1">{event.title}</p>
        </div>
      </div>

      <div className="bg-background rounded-lg border p-6">
        <TicketTypesManager 
          eventId={event.id} 
          initialTickets={event.ticketTypes} 
          hasSeating={event.hasSeating}
        />
      </div>

      {event.hasSeating && (
        <div className="bg-background rounded-lg border p-6">
          <SeatLayoutGenerator 
            eventId={event.id}
            ticketTypes={event.ticketTypes}
            existingSeats={event.seats}
          />
        </div>
      )}
    </div>
  )
}

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import { EventForm } from "@/components/events/EventForm"
import { EventActions } from "@/components/events/EventActions"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"

export default async function EditEventPage(props: { params: Promise<{ id: string }> }) {
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
      ticketTypes: true,
      organizer: { select: { upiQrUrl: true } }
    }
  })

  if (!event) notFound()

  if (event.organizerId !== session.user.id) {
    redirect("/organizer")
  }

  const hasSoldTickets = event.ticketTypes.some(t => t.sold > 0)

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-3xl space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" render={<Link href="/organizer" />} nativeButton={false}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Edit Event</h1>
          <p className="text-muted-foreground mt-1">{event.title}</p>
        </div>
      </div>

      <div className="p-4 bg-muted/50 rounded-lg border">
        <h2 className="text-sm font-semibold mb-2">Event Actions</h2>
        <EventActions event={event} />
      </div>

      <EventForm event={event} hasSoldTickets={hasSoldTickets} organizerUpiQrUrl={event.organizer.upiQrUrl} />
    </div>
  )
}

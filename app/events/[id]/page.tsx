import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, MapPinIcon, TicketIcon, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import Script from "next/script"
import { EventBookingForm } from "@/components/events/EventBookingForm"
import { BackButton } from "@/components/BackButton"
import { auth } from "@/auth"
import { getEventLifecycleState } from "@/lib/utils"

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function EventDetailsPage(props: PageProps) {
  const params = await props.params;
  const event = await prisma.event.findUnique({
    where: { 
      id: params.id, 
      status: { in: ["PUBLISHED", "CANCELLED"] } 
    },
    include: {
      ticketTypes: true,
      organizer: {
        select: {
          name: true,
          upiId: true,
          upiName: true,
          upiQrUrl: true,
          upiVerified: true,
        }
      }
    }
  })

  if (!event) notFound()

  const session = await auth()
  const activeHolds = await prisma.seatHold.groupBy({
    by: ['ticketTypeId'],
    where: {
      eventId: event.id,
      expiresAt: { gt: new Date() }
    },
    _sum: { quantity: true }
  })

  const holdsMap = activeHolds.reduce((acc, curr) => {
    acc[curr.ticketTypeId] = curr._sum.quantity || 0
    return acc
  }, {} as Record<string, number>)

  const availableByTicketId = event.ticketTypes.reduce((acc, t) => {
    acc[t.id] = t.quantity - t.sold - (holdsMap[t.id] || 0)
    return acc
  }, {} as Record<string, number>)

  const totalQuantity = event.ticketTypes.reduce((acc, t) => acc + t.quantity, 0)
  const totalSoldAndHeld = event.ticketTypes.reduce((acc, t) => acc + t.sold + (holdsMap[t.id] || 0), 0)
  const isSoldOut = totalQuantity > 0 && totalSoldAndHeld >= totalQuantity

  const lifecycleState = getEventLifecycleState(new Date(event.startsAt), new Date(event.endsAt))

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6 max-w-5xl">
      <BackButton fallbackUrl="/events" label="Back to Events" />

      <div 
        className="w-full h-[300px] md:h-[400px] bg-muted rounded-xl bg-cover bg-center relative overflow-hidden shadow-md"
        style={{ backgroundImage: `url(${event.bannerUrl || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1200"})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-8 text-white">
          <Badge className="w-fit mb-4">{event.category}</Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">{event.title}</h1>
          <p className="text-white/80 flex items-center gap-2">
            <Users className="w-4 h-4" /> Organized by {event.organizer.name}
          </p>
        </div>
        {event.status === "CANCELLED" ? (
          <div className="absolute top-4 right-4">
            <Badge variant="destructive" className="text-lg px-4 py-1 shadow-lg shadow-black/50 border-2 border-white/20">
              EVENT CANCELLED
            </Badge>
          </div>
        ) : lifecycleState === "ENDED" ? (
          <div className="absolute top-4 right-4">
            <Badge variant="destructive" className="text-lg px-4 py-1 shadow-lg shadow-black/50 border-2 border-white/20">
              EVENT ENDED
            </Badge>
          </div>
        ) : lifecycleState === "STARTED" ? (
          <div className="absolute top-4 right-4">
            <Badge className="bg-amber-500 hover:bg-amber-600 text-lg px-4 py-1 shadow-lg shadow-black/50 border-2 border-white/20">
              EVENT STARTED
            </Badge>
          </div>
        ) : isSoldOut && (
          <div className="absolute top-4 right-4">
            <Badge variant="destructive" className="text-lg px-4 py-1 shadow-lg shadow-black/50 border-2 border-white/20">
              SOLD OUT
            </Badge>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">About This Event</h2>
            <div className="prose max-w-none text-muted-foreground whitespace-pre-wrap">
              {event.description}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <div className="bg-muted/30 border rounded-xl p-6 space-y-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3 text-muted-foreground">
                <CalendarIcon className="w-5 h-5 mt-0.5 text-foreground shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Date and Time</p>
                  <p>{new Date(event.startsAt).toLocaleString()}</p>
                  <p>to {new Date(event.endsAt).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-muted-foreground">
                <MapPinIcon className="w-5 h-5 mt-0.5 text-foreground shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Location</p>
                  <p>{event.venueName}</p>
                  <p>{event.address}, {event.city}</p>
                </div>
              </div>
            </div>

            {event.status === "CANCELLED" && event.cancellationReason && (
              <div className="bg-destructive/10 text-destructive border-destructive/20 border p-4 rounded-xl">
                <h3 className="font-semibold mb-1">Event Cancelled</h3>
                <p className="text-sm">{event.cancellationReason}</p>
                <p className="text-xs mt-2 opacity-80">
                  Refunds for paid bookings will be processed according to the organizer's policy.
                </p>
              </div>
            )}

            <hr />

            <EventBookingForm 
              eventId={event.id}
              ticketTypes={event.ticketTypes}
              availableByTicketId={availableByTicketId}
              userAuthenticated={!!session?.user}
              lifecycleState={event.status === "CANCELLED" ? "ENDED" : lifecycleState}
              organizerUpi={{
                upiId: event.organizer.upiId,
                upiName: event.organizer.upiName,
                upiQrUrl: event.organizer.upiQrUrl,
                upiVerified: event.organizer.upiVerified
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

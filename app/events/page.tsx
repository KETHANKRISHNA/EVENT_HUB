import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, MapPinIcon, TicketIcon } from "lucide-react"

export default async function EventsPage() {
  const events = await prisma.event.findMany({
    where: { 
      status: "PUBLISHED",
      endsAt: { gt: new Date() }
    },
    orderBy: { startsAt: "asc" },
    include: {
      ticketTypes: true,
    },
  })

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Explore Events</h1>
        <p className="text-muted-foreground mt-1">
          Discover and book tickets for upcoming conferences, concerts, and more.
        </p>
      </div>

      {events.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No upcoming events</h2>
          <p className="text-muted-foreground">Check back soon for new event announcements.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => {
            const minPrice = event.ticketTypes.length > 0
              ? Math.min(...event.ticketTypes.map((t) => t.pricePaise))
              : 0

            const totalQuantity = event.ticketTypes.reduce((acc, t) => acc + t.quantity, 0)
            const totalSold = event.ticketTypes.reduce((acc, t) => acc + t.sold, 0)
            const isSoldOut = totalQuantity > 0 && totalSold >= totalQuantity

            return (
              <Card key={event.id} className="overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                <div
                  className="h-48 bg-muted bg-cover bg-center relative"
                  style={{
                    backgroundImage: `url(${
                      event.bannerUrl || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800"
                    })`,
                  }}
                >
                  {isSoldOut && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white font-bold text-xl tracking-wider uppercase border-2 border-white px-4 py-2 rounded-md bg-black/40 backdrop-blur-sm shadow-[0_0_15px_rgba(255,255,255,0.5)]">EVENT SOLD OUT</span>
                    </div>
                  )}
                </div>
                <CardHeader>
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="line-clamp-1">{event.title}</CardTitle>
                    <Badge variant="secondary">{event.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 shrink-0" />
                    <span>{new Date(event.startsAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPinIcon className="h-4 w-4 shrink-0" />
                    <span className="line-clamp-1">
                      {event.city} - {event.venueName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TicketIcon className="h-4 w-4 shrink-0" />
                    <span className={isSoldOut ? "line-through" : ""}>
                      {minPrice === 0 ? "Free" : `From ₹${(minPrice / 100).toFixed(0)}`}
                    </span>
                  </div>
                </CardContent>
                <CardFooter className="pt-4 bg-muted/30 border-t">
                  <Button
                    className="w-full"
                    render={<Link href={`/events/${event.id}`} />}
                    nativeButton={false}
                    variant={isSoldOut ? "secondary" : "default"}
                  >
                    {isSoldOut ? "View Details" : "Get Tickets"}
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

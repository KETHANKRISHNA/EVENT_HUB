import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, MapPinIcon, TicketIcon, PlusIcon, AlertCircleIcon } from "lucide-react"
import { SubmitEventButton } from "@/components/organizer/SubmitEventButton"
import { CancelEventButton } from "@/components/organizer/CancelEventButton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { VerifyPaymentButtons } from "@/components/organizer/VerifyPaymentButtons"

export default async function OrganizerDashboard(props: { searchParams: Promise<{ status?: string }> }) {
  const searchParams = await props.searchParams;
  const session = await auth()
  if (!session) {
    redirect("/login")
  }
  if (session.user.role !== "ORGANIZER") {
    redirect("/")
  }

  const events = await prisma.event.findMany({
    where: { organizerId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      ticketTypes: true
    }
  })

  const filterStatus = searchParams.status;
  const filteredEvents = filterStatus ? events.filter(e => e.status === filterStatus) : events;

  const recentBookings = await prisma.booking.findMany({
    where: {
      event: { organizerId: session.user.id }
    },
    include: {
      event: { select: { title: true } },
      user: { select: { name: true, email: true } },
      tickets: { include: { ticketType: true } },
      items: { include: { ticketType: true } },
      payments: { orderBy: { createdAt: "desc" }, take: 1 }
    },
    orderBy: { createdAt: "desc" },
    take: 15
  })

  const draftsCount = events.filter(e => e.status === "DRAFT").length
  const pendingCount = events.filter(e => e.status === "PENDING_REVIEW").length
  const publishedCount = events.filter(e => e.status === "PUBLISHED").length
  const rejectedCount = events.filter(e => e.status === "REJECTED").length
  const cancelledCount = events.filter(e => e.status === "CANCELLED").length

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Events Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage your events and tickets.</p>
        </div>
        <Button render={<Link href="/organizer/events/new" />} nativeButton={false}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Create Event
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Link href="/organizer" className="block transition-transform hover:scale-105 active:scale-95">
          <Card className={!filterStatus ? "ring-2 ring-primary" : ""}>
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Events</CardTitle>
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{events.length}</div></CardContent>
          </Card>
        </Link>
        <Link href="?status=DRAFT" className="block transition-transform hover:scale-105 active:scale-95">
          <Card className={filterStatus === "DRAFT" ? "ring-2 ring-primary" : ""}>
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">Drafts</CardTitle>
            </CardHeader>
            <CardContent><div className="text-2xl font-bold text-gray-500">{draftsCount}</div></CardContent>
          </Card>
        </Link>
        <Link href="?status=PENDING_REVIEW" className="block transition-transform hover:scale-105 active:scale-95">
          <Card className={filterStatus === "PENDING_REVIEW" ? "ring-2 ring-primary" : ""}>
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Review</CardTitle>
            </CardHeader>
            <CardContent><div className="text-2xl font-bold text-amber-500">{pendingCount}</div></CardContent>
          </Card>
        </Link>
        <Link href="?status=PUBLISHED" className="block transition-transform hover:scale-105 active:scale-95">
          <Card className={filterStatus === "PUBLISHED" ? "ring-2 ring-primary" : ""}>
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">Published</CardTitle>
            </CardHeader>
            <CardContent><div className="text-2xl font-bold text-green-600">{publishedCount}</div></CardContent>
          </Card>
        </Link>
        <Link href="?status=REJECTED" className="block transition-transform hover:scale-105 active:scale-95">
          <Card className={filterStatus === "REJECTED" ? "ring-2 ring-primary" : ""}>
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">Rejected</CardTitle>
            </CardHeader>
            <CardContent><div className="text-2xl font-bold text-red-500">{rejectedCount}</div></CardContent>
          </Card>
        </Link>
        <Link href="?status=CANCELLED" className="block transition-transform hover:scale-105 active:scale-95">
          <Card className={filterStatus === "CANCELLED" ? "ring-2 ring-primary" : ""}>
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">Cancelled</CardTitle>
            </CardHeader>
            <CardContent><div className="text-2xl font-bold text-slate-400">{cancelledCount}</div></CardContent>
          </Card>
        </Link>
      </div>

      {filterStatus && (
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold capitalize">
            {filterStatus.replace("_", " ").toLowerCase()} Events
          </h2>
          <Button variant="ghost" size="sm" render={<Link href="/organizer" />} nativeButton={false}>
            Clear Filter
          </Button>
        </div>
      )}

      {filteredEvents.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <CalendarIcon className="h-6 w-6 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No events found</h2>
          <p className="text-muted-foreground mb-6">
            {filterStatus ? `You have no ${filterStatus.replace("_", " ").toLowerCase()} events.` : "You haven't created any events yet."}
          </p>
          {!filterStatus && (
            <Button render={<Link href="/organizer/events/new" />} nativeButton={false}>
              Create your first event
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => {
            const ticketsSold = event.ticketTypes.reduce((acc, curr) => acc + curr.sold, 0)
            
            return (
              <Card key={event.id} className="overflow-hidden flex flex-col">
                <div 
                  className="h-48 bg-muted bg-cover bg-center"
                  style={{ backgroundImage: `url(${event.bannerUrl || 'https://via.placeholder.com/800x400?text=No+Banner'})` }}
                />
                <CardHeader>
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="line-clamp-1">{event.title}</CardTitle>
                    <Badge variant={
                      event.status === "PUBLISHED" ? "default" :
                      event.status === "PENDING_REVIEW" ? "secondary" :
                      event.status === "REJECTED" ? "destructive" : "outline"
                    }>
                      {event.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-4 text-sm text-muted-foreground">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 shrink-0" />
                      <span>{new Date(event.startsAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPinIcon className="h-4 w-4 shrink-0" />
                      <span className="line-clamp-1">{event.city} - {event.venueName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TicketIcon className="h-4 w-4 shrink-0" />
                      <span>{ticketsSold} tickets sold</span>
                    </div>
                  </div>

                  {event.status === "REJECTED" && event.rejectionReason && (
                    <div className="bg-red-50 text-red-800 p-3 rounded-md text-sm border border-red-200">
                      <div className="flex items-center font-semibold mb-1 gap-1">
                        <AlertCircleIcon className="h-4 w-4" /> Reason:
                      </div>
                      <span className="line-clamp-2">{event.rejectionReason}</span>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex flex-wrap gap-2 pt-4 bg-muted/50 border-t">
                  
                  {event.status === "PUBLISHED" && (
                    <>
                      <Button size="sm" variant="outline" render={<Link href={`/events/${event.id}`} />} nativeButton={false}>
                        View
                      </Button>
                      <Button size="sm" variant="default" render={<Link href={`/organizer/events/${event.id}/edit`} />} nativeButton={false}>
                        Edit
                      </Button>
                      <Button size="sm" variant="secondary" render={<Link href={`/organizer/events/${event.id}/tickets`} />} nativeButton={false}>
                        Tickets
                      </Button>
                    </>
                  )}

                  {event.status === "DRAFT" && (
                    <>
                      <Button size="sm" variant="default" render={<Link href={`/organizer/events/${event.id}/edit`} />} nativeButton={false}>
                        Edit
                      </Button>
                      <SubmitEventButton eventId={event.id} />
                    </>
                  )}

                  {event.status === "PENDING_REVIEW" && (
                    <Button size="sm" variant="outline" disabled className="w-full">
                      Under Review
                    </Button>
                  )}

                  {event.status === "REJECTED" && (
                    <>
                      <Button size="sm" variant="default" render={<Link href={`/organizer/events/${event.id}/edit`} />} nativeButton={false}>
                        Edit
                      </Button>
                      <SubmitEventButton eventId={event.id} />
                    </>
                  )}

                  {event.status === "CANCELLED" && (
                    <Button size="sm" variant="outline" disabled className="w-full">
                      Cancelled
                    </Button>
                  )}

                  {event.status !== "CANCELLED" && (
                    <CancelEventButton eventId={event.id} />
                  )}

                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}

      {recentBookings.length > 0 && (
        <div className="pt-8">
          <div className="mb-4">
            <h2 className="text-2xl font-bold tracking-tight">Recent Payments & Bookings</h2>
            <p className="text-muted-foreground mt-1">Review the latest transactions for your events.</p>
          </div>
          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking Ref</TableHead>
                  <TableHead>Attendee</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Tickets</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Transaction</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentBookings.map((booking) => {
                  const payment = booking.payments[0]
                  // Use BookingItems for precise quantity, fallback to actual tickets if it's an old CONFIRMED booking
                  const ticketsSummary = booking.items.length > 0 
                    ? booking.items.reduce((acc, curr) => {
                        acc[curr.ticketType.name] = (acc[curr.ticketType.name] || 0) + curr.quantity
                        return acc
                      }, {} as Record<string, number>)
                    : booking.tickets.reduce((acc, curr) => {
                        acc[curr.ticketType.name] = (acc[curr.ticketType.name] || 0) + 1
                        return acc
                      }, {} as Record<string, number>)
                  
                  return (
                    <TableRow key={booking.id}>
                      <TableCell className="font-mono text-xs">{booking.id.split("-")[0]}</TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{booking.user.name}</div>
                        <div className="text-xs text-muted-foreground">{booking.user.email}</div>
                      </TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate" title={booking.event.title}>
                        {booking.event.title}
                      </TableCell>
                      <TableCell className="text-xs">
                        {Object.entries(ticketsSummary).map(([name, qty]) => (
                          <div key={name}>{qty}x {name}</div>
                        ))}
                      </TableCell>
                      <TableCell>₹{(booking.totalPaise / 100).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={
                          booking.status === "CONFIRMED" ? "default" :
                          booking.status === "PAYMENT_REVIEW" ? "secondary" : 
                          booking.status === "REJECTED" ? "destructive" : "outline"
                        }>
                          {booking.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {payment?.utr ? `UTR: ${payment.utr}` : "No UTR"}
                        {booking.status === "PAYMENT_REVIEW" && (
                          <VerifyPaymentButtons bookingId={booking.id} />
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  )
}

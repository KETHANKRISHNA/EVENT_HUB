import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CalendarIcon, MapPinIcon, TicketIcon, UserIcon } from "lucide-react"
import { EventReviewActions } from "@/components/manager/EventReviewActions"
import { ManagerCancelAction } from "@/components/manager/ManagerCancelAction"
import { ManagerRepublishAction } from "@/components/manager/ManagerRepublishAction"
import { BackButton } from "@/components/BackButton"

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ManagerEventReviewPage({ params }: PageProps) {
  const { id } = await params;

  if (!id) notFound()

  const session = await auth()
  if (!session) {
    redirect("/login")
  }
  if (session.user.role !== "MANAGER") {
    redirect("/")
  }

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      organizer: true,
      ticketTypes: true
    }
  })

  if (!event) notFound()

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-4xl space-y-8">
      <div className="flex items-center gap-4">
        <BackButton fallbackUrl="/manager" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Review Event Submission</h1>
          <p className="text-muted-foreground mt-1">Review the details and approve or reject this event.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <div 
              className="h-64 bg-muted bg-cover bg-center rounded-t-xl"
              style={{ backgroundImage: `url(${event.bannerUrl || 'https://via.placeholder.com/800x400'})` }}
            />
            <CardHeader>
              <div className="flex justify-between items-start gap-2">
                <div>
                  <CardTitle className="text-2xl">{event.title}</CardTitle>
                  <CardDescription className="mt-2 text-base">
                    {event.description}
                  </CardDescription>
                </div>
                <Badge className="text-base py-1" variant={
                  event.status === "PENDING_REVIEW" ? "secondary" :
                  event.status === "PUBLISHED" ? "default" :
                  event.status === "REJECTED" ? "destructive" : "outline"
                }>
                  {event.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarIcon className="h-5 w-5" />
                <span>
                  {new Date(event.startsAt).toLocaleString()} - {new Date(event.endsAt).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPinIcon className="h-5 w-5" />
                <span>
                  {event.venueName}, {event.address}, {event.city}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ticket Information</CardTitle>
            </CardHeader>
            <CardContent>
              {event.ticketTypes.length === 0 ? (
                <p className="text-muted-foreground">No tickets configured yet.</p>
              ) : (
                <div className="space-y-4">
                  {event.ticketTypes.map((ticket) => (
                    <div key={ticket.id} className="flex justify-between items-center p-4 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <TicketIcon className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">{ticket.name}</span>
                      </div>
                      <div className="text-right">
                        <div>₹{(ticket.pricePaise / 100).toFixed(0)}</div>
                        <div className="text-sm text-muted-foreground">Qty: {ticket.quantity}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Organizer Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">{event.organizer.name}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Email:</span>
                <p>{event.organizer.email}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Phone:</span>
                <p>{event.organizer.phone || "Not provided"}</p>
              </div>
            </CardContent>
          </Card>

          {event.status === "PENDING_REVIEW" && (
            <Card>
              <CardHeader>
                <CardTitle>Manager Actions</CardTitle>
                <CardDescription>
                  Approve to publish the event, or reject with a reason.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EventReviewActions eventId={event.id} />
              </CardContent>
            </Card>
          )}

          {event.status === "PUBLISHED" && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-600">Danger Zone</CardTitle>
                <CardDescription>
                  Cancel this published event to stop further ticket sales.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ManagerCancelAction eventId={event.id} />
              </CardContent>
            </Card>
          )}

          {event.status === "CANCELLED" && (
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="text-green-700">Recovery Actions</CardTitle>
                <CardDescription>
                  Republish this cancelled event to resume ticket sales.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ManagerRepublishAction eventId={event.id} />
              </CardContent>
            </Card>
          )}

          {event.rejectionReason && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-800 text-lg">Rejection Reason</CardTitle>
              </CardHeader>
              <CardContent className="text-red-700">
                {event.rejectionReason}
              </CardContent>
            </Card>
          )}

          {event.cancellationReason && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-800 text-lg">Cancellation Reason</CardTitle>
              </CardHeader>
              <CardContent className="text-red-700">
                <p className="mb-2">{event.cancellationReason}</p>
                <p className="text-sm opacity-80">Cancelled at: {event.cancelledAt ? new Date(event.cancelledAt).toLocaleString() : "Unknown"}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

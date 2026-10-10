import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { TicketIcon, Calendar, MapPin } from "lucide-react"
import { BackButton } from "@/components/BackButton"

export default async function MyBookings() {
  const session = await auth()
  if (!session) {
    redirect("/login")
  }

  const bookings = await prisma.booking.findMany({
    where: { userId: session.user.id },
    include: {
      event: {
        include: {
          organizer: true
        }
      },
      tickets: {
        include: { ticketType: true }
      },
      items: {
        include: { ticketType: true }
      },
      payments: true
    },
    orderBy: { createdAt: "desc" }
  })

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-5xl">
      <div className="flex items-center gap-4 mb-8">
        <BackButton fallbackUrl="/events" />
        <h1 className="text-3xl font-bold tracking-tight">My Bookings</h1>
      </div>
      
      {bookings.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border rounded-xl bg-muted/20">
          <p>You haven't booked any tickets yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {bookings.map(booking => {
            const isConfirmed = booking.status === "CONFIRMED"
            
            return (
              <div key={booking.id} className="border rounded-xl bg-card overflow-hidden">
                <div className="p-6">
                  <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                    <div>
                      <h2 className="text-2xl font-semibold mb-2">{booking.event.title}</h2>
                      <div className="flex flex-col text-sm text-muted-foreground space-y-1">
                        <span className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {format(new Date(booking.event.startsAt), "PPp")}</span>
                        <span className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {booking.event.venueName}, {booking.event.city}</span>
                        <span className="text-xs text-muted-foreground mt-1">Organized by {booking.event.organizer.name}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 text-right">
                      <Badge variant={isConfirmed ? "default" : "secondary"}>
                        {booking.status}
                      </Badge>
                      <span className="text-sm font-medium">Order: #{booking.id.slice(-8).toUpperCase()}</span>
                      <span className="text-sm font-bold">Total: ₹{booking.totalPaise / 100}</span>
                      {booking.payments[0]?.utr && (
                        <span className="text-xs text-muted-foreground">UTR: {booking.payments[0].utr}</span>
                      )}
                    </div>
                  </div>
                  
                  {booking.event.status === "CANCELLED" && (
                    <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex justify-between items-center">
                      <div>
                        <strong>Event Cancelled:</strong> {booking.event.cancellationReason}
                      </div>
                      {isConfirmed && (
                        <Badge variant="outline" className="border-destructive/50">
                          Refund Pending
                        </Badge>
                      )}
                    </div>
                  )}

                  {(booking.items.length > 0 || (isConfirmed && booking.tickets.length > 0)) && (
                    <div className="mt-6 border-t pt-4">
                      <h3 className="font-semibold mb-3 flex items-center gap-2"><TicketIcon className="w-4 h-4" /> Ticket Details</h3>
                      
                      <div className="space-y-4">
                        <div className="bg-muted/30 border rounded-lg overflow-hidden">
                          <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-muted-foreground">
                              <tr>
                                <th className="text-left p-3 font-medium">Type</th>
                                <th className="text-center p-3 font-medium">Price</th>
                                <th className="text-center p-3 font-medium">Qty</th>
                                <th className="text-right p-3 font-medium">Subtotal</th>
                              </tr>
                            </thead>
                            <tbody>
                              {booking.items.length > 0 
                                ? booking.items.map((item) => (
                                    <tr key={item.id} className="border-t">
                                      <td className="p-3">{item.ticketType.name}</td>
                                      <td className="p-3 text-center">₹{item.pricePaise / 100}</td>
                                      <td className="p-3 text-center">{item.quantity}</td>
                                      <td className="p-3 text-right font-medium">₹{(item.pricePaise * item.quantity) / 100}</td>
                                    </tr>
                                  ))
                                : Object.entries(
                                    booking.tickets.reduce((acc, t) => {
                                      if (!acc[t.ticketType.id]) {
                                        acc[t.ticketType.id] = {
                                          name: t.ticketType.name,
                                          price: t.ticketType.pricePaise / 100,
                                          qty: 0
                                        }
                                      }
                                      acc[t.ticketType.id].qty += 1;
                                      return acc;
                                    }, {} as Record<string, {name: string, price: number, qty: number}>)
                                  ).map(([id, t]) => (
                                    <tr key={id} className="border-t">
                                      <td className="p-3">{t.name}</td>
                                      <td className="p-3 text-center">₹{t.price}</td>
                                      <td className="p-3 text-center">{t.qty}</td>
                                      <td className="p-3 text-right font-medium">₹{t.price * t.qty}</td>
                                    </tr>
                                  ))
                              }
                            </tbody>
                          </table>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {booking.tickets.map(t => (
                            <div key={t.id} className="border bg-background p-3 rounded-lg flex justify-between items-center shadow-sm">
                              <div>
                                <p className="font-medium text-sm">{t.ticketType.name}</p>
                                <p className="text-xs text-muted-foreground font-mono">ID: {t.id.slice(-8).toUpperCase()}</p>
                              </div>
                              <Badge variant="outline">{t.status}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

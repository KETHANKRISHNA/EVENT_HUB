import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, MapPinIcon, UserIcon, ClockIcon } from "lucide-react"

export default async function ManagerDashboard(props: { searchParams: Promise<{ status?: string }> }) {
  const searchParams = await props.searchParams;
  const session = await auth()
  if (!session) {
    redirect("/login")
  }
  if (session.user.role !== "MANAGER") {
    redirect("/")
  }

  const events = await prisma.event.findMany({
    where: {
      status: { not: "DRAFT" }
    },
    orderBy: { createdAt: "desc" },
    include: {
      organizer: true
    }
  })

  const filterStatus = searchParams.status || "PENDING_REVIEW";
  const filteredEvents = events.filter(e => e.status === filterStatus)

  const pendingCount = events.filter(e => e.status === "PENDING_REVIEW").length
  const publishedCount = events.filter(e => e.status === "PUBLISHED").length
  const rejectedCount = events.filter(e => e.status === "REJECTED").length
  const cancelledCount = events.filter(e => e.status === "CANCELLED").length

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Manager Dashboard</h1>
        <p className="text-muted-foreground mt-1">Review and manage organizer event submissions.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="?status=PENDING_REVIEW" className="block transition-transform hover:scale-105 active:scale-95">
          <Card className={filterStatus === "PENDING_REVIEW" ? "ring-2 ring-primary" : ""}>
            <CardHeader className="py-4">
              <CardTitle className="text-xl">Pending Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">{pendingCount}</div>
            </CardContent>
          </Card>
        </Link>
        <Link href="?status=PUBLISHED" className="block transition-transform hover:scale-105 active:scale-95">
          <Card className={filterStatus === "PUBLISHED" ? "ring-2 ring-primary" : ""}>
            <CardHeader className="py-4">
              <CardTitle className="text-xl">Published</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{publishedCount}</div>
            </CardContent>
          </Card>
        </Link>
        <Link href="?status=REJECTED" className="block transition-transform hover:scale-105 active:scale-95">
          <Card className={filterStatus === "REJECTED" ? "ring-2 ring-primary" : ""}>
            <CardHeader className="py-4">
              <CardTitle className="text-xl">Rejected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{rejectedCount}</div>
            </CardContent>
          </Card>
        </Link>
        <Link href="?status=CANCELLED" className="block transition-transform hover:scale-105 active:scale-95">
          <Card className={filterStatus === "CANCELLED" ? "ring-2 ring-primary" : ""}>
            <CardHeader className="py-4">
              <CardTitle className="text-xl">Cancelled</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-600">{cancelledCount}</div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight capitalize">
            {filterStatus.replace("_", " ").toLowerCase()} Events
          </h2>
          {filterStatus !== "PENDING_REVIEW" && (
            <Button variant="ghost" size="sm" render={<Link href="/manager" />} nativeButton={false}>
              Clear Filter
            </Button>
          )}
        </div>
        
        {filteredEvents.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <h3 className="text-xl font-semibold mb-2">No {filterStatus.replace("_", " ").toLowerCase()} events</h3>
            <p className="text-muted-foreground">There are no events matching this status.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <Card key={event.id} className="overflow-hidden flex flex-col">
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
                  <CardDescription className="line-clamp-1">by {event.organizer.name}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4" />
                    <span>{event.organizer.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs">Phone:</span>
                    <span>{event.organizer.phone || "Not provided"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    <span>{new Date(event.startsAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPinIcon className="h-4 w-4" />
                    <span className="line-clamp-1">{event.city}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ClockIcon className="h-4 w-4" />
                    <span>Submitted: {new Date(event.createdAt).toLocaleDateString()}</span>
                  </div>
                </CardContent>
                <CardFooter className="pt-4 bg-muted/50 border-t">
                  <Button className="w-full" render={<Link href={`/manager/events/${event.id}`} />} nativeButton={false}>
                    {event.status === "PENDING_REVIEW" ? "Review Event" : "View Details"}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

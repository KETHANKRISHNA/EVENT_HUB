import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { EventForm } from "@/components/events/EventForm"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"

import { prisma } from "@/lib/prisma"

export default async function NewEventPage() {
  const session = await auth()
  if (!session) {
    redirect("/login")
  }
  if (session.user.role !== "ORGANIZER") {
    redirect("/")
  }

  const organizer = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { upiQrUrl: true }
  })

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-3xl space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" render={<Link href="/organizer" />} nativeButton={false}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Event</h1>
          <p className="text-muted-foreground mt-1">Fill in the details to start selling tickets.</p>
        </div>
      </div>

      <EventForm organizerUpiQrUrl={organizer?.upiQrUrl} />
    </div>
  )
}

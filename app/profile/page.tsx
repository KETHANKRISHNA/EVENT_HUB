import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { CircleUser } from "lucide-react"
import { SwitchRoleButton } from "./SwitchRoleButton"
import { ChangePasswordForm } from "./ChangePasswordForm"
import { BackButton } from "@/components/BackButton"
import { UpiSettingsForm } from "@/components/profile/UpiSettingsForm"
import { UpdatePhoneForm } from "@/components/profile/UpdatePhoneForm"

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      _count: {
        select: {
          bookings: true,
          events: true,
        },
      },
    },
  })

  if (!user) {
    redirect("/login")
  }

  const bookingCount = user._count.bookings
  const eventCount = user._count.events

  const canSwitchToOrganizer = user.role === "ATTENDEE" && bookingCount === 0
  const canSwitchToAttendee = user.role === "ORGANIZER" && eventCount === 0
  const fallbackUrl = user.role === "MANAGER" ? "/manager" : user.role === "ORGANIZER" ? "/organizer" : "/events"

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-4 max-w-2xl">
      <BackButton fallbackUrl={fallbackUrl} />
      
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
        <p className="text-muted-foreground mt-2">
          Your profile information is displayed below.
        </p>
      </div>

      <div className="grid gap-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              {user.image ? (
                <img
                  src={user.image}
                  alt={user.name}
                  className="h-16 w-16 rounded-full object-cover border-2 shadow-sm"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                  <CircleUser className="h-10 w-10 text-muted-foreground" />
                </div>
              )}
              <div>
                <CardTitle className="text-xl">{user.name}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <span>{user.email}</span>
                  <Badge variant="secondary" className="capitalize">
                    {user.role.toLowerCase()}
                  </Badge>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input id="email" value={user.email} readOnly disabled className="bg-muted/50" />
              <p className="text-xs text-muted-foreground">
                Cannot be modified directly.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={user.name} readOnly disabled className="bg-muted/50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Account Role</Label>
              <Input id="role" value={user.role} readOnly disabled className="bg-muted/50" />
            </div>
            
            <div className="border-t pt-4 mt-2">
              <UpdatePhoneForm initialPhone={user.phone} />
            </div>
          </CardContent>

          {/* Role switching section */}
          <CardFooter className="flex flex-col items-start gap-3 border-t pt-4">
            <div>
              <h4 className="text-sm font-semibold">Account Role Management</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {user.role === "ATTENDEE"
                    ? "Attendees can switch to an organizer account if they have no active bookings."
                    : "Organizers can switch to an attendee account if they have no created events."}
                </p>
              </div>

              {canSwitchToOrganizer && (
                <SwitchRoleButton targetRole="ORGANIZER" />
              )}

              {canSwitchToAttendee && (
                <SwitchRoleButton targetRole="ATTENDEE" />
              )}

              {user.role === "ATTENDEE" && bookingCount > 0 && (
                <p className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded-md border border-amber-200">
                  You have {bookingCount} booking(s). Role switching is only permitted when you have no bookings.
                </p>
              )}

              {user.role === "ORGANIZER" && eventCount > 0 && (
                <p className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded-md border border-amber-200">
                  You have {eventCount} event(s). Role switching is only permitted when you have no created events.
                </p>
              )}
            </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Change Password</CardTitle>
            <CardDescription>
              Update your account password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm email={user.email} />
          </CardContent>
        </Card>

        {user.role === "ORGANIZER" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">UPI Payment Settings</CardTitle>
              <CardDescription>
                Configure your UPI payment details to receive direct payments from attendees.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UpiSettingsForm 
                initialUpiId={user.upiId} 
                initialUpiName={user.upiName}
                initialUpiQrUrl={user.upiQrUrl} 
                isVerified={user.upiVerified} 
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
